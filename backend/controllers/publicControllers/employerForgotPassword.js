import database from "../../configs/database.js";
import validateEmail from "../../utils/validateEmailAddress.js";
import validPassword from "../../utils/validatePassword.js";
import { sendPasswordResetCode } from "../../utils/sendVerificationEmail.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const CODE_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;


export async function forgotPassword(req, res) {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address.",
            issue: "email"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let connection;

    try {

       const [existingEmployer] = await database.query(`
            SELECT employerID FROM employers WHERE LOWER(email) = ? LIMIT 1`,
            [normalizedEmail]
        );

        if (existingEmployer.length === 0) {
            return res.status(409).json({
                message: "User account not found",
                issue: "email"
            });
        }

        const [pendingRows] = await database.query(
            `SELECT createdAt FROM passwordResets WHERE email = ?`,
            [normalizedEmail]
        );

        if (pendingRows.length > 0) {
            const secondsSinceLastSend =
                (Date.now() - new Date(pendingRows[0].createdAt).getTime()) / 1000;

            if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
                return res.status(429).json({
                    message: `Too many requests. Please wait 1 minute and try again.`,
                    issue: "cooldown"
                });
            }
        }


        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const hashedCode = crypto
            .createHash("sha256")
            .update(verificationCode)
            .digest("hex");

        connection = await database.getConnection();
        await connection.beginTransaction();     
        
        await connection.query(
            `
            INSERT INTO passwordResets (
                userID,
                userType,
                email,
                verificationCode,
                attempts,
                expiresAt,
                createdAt
            )
            VALUES (?, 'employer', ?, ?, 0, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())
            ON DUPLICATE KEY UPDATE
                email            = VALUES(email),
                verificationCode = VALUES(verificationCode),
                attempts         = 0,
                expiresAt        = VALUES(expiresAt),
                createdAt        = NOW()
            `,
            [
                existingEmployer[0].employerID,
                normalizedEmail,
                hashedCode,
                CODE_EXPIRY_MINUTES
            ]
        );

        await connection.commit();
        
        await sendPasswordResetCode(normalizedEmail, verificationCode);

        return res.status(201).json({
            message: "Verification code has been sent to your email",
            email: normalizedEmail
        });

    } catch (error) {
        console.error(error);

        if (connection) {
            await connection.rollback();
        }

        return res.status(500).json({
            message: "Unable to connect to the server. Please try again.",
            error: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }        
    }
}


export async function verifyPasswordCode(req, res) {
    const { code, email } = req.body;

    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
        return res.status(400).json({
            message: "Enter a valid 6-digit code",
            issue: "invalid"
        });
    }

    if (!email || typeof email !== "string") {
        return res.status(400).json({
            message: "Email is required",
            issue: "email"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const submittedCode = code.trim();

    let connection;

    try {
        const [[user]] = await database.query(
            `SELECT employerID FROM employers WHERE LOWER(email) = ? LIMIT 1`,
            [normalizedEmail]
        );

        if (!user) {
            return res.status(400).json({
                message: "User account does not exist",
                issue: "invalid"
            });
        }

        const userID = user.employerID;

        connection = await database.getConnection();
        await connection.beginTransaction();

        const [pendingRows] = await connection.query(
            `
            SELECT *
            FROM passwordResets
            WHERE userID = ? AND userType = 'employer'
            FOR UPDATE
            `,
            [userID]
        );

        if (pendingRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "No pending password reset request found. Please submit a new request.",
                issue: "invalid"
            });
        }

        const pending = pendingRows[0];

        // 1. Lockout check
        if (pending.attempts >= MAX_ATTEMPTS) {
            await connection.rollback();
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new code.",
                issue: "invalid"
            });
        }

        // 2. Expiry check
        const isExpired = new Date(pending.expiresAt).getTime() < Date.now();

        if (isExpired) {
            await connection.rollback();
            return res.status(410).json({
                message: "This code has expired. Please request a new code.",
                issue: "invalid"
            });
        }

        // 3. Code match check
        const hashedSubmittedCode = crypto
            .createHash("sha256")
            .update(submittedCode)
            .digest("hex");

        const storedCodeBuffer = Buffer.from(pending.verificationCode, "hex");
        const submittedCodeBuffer = Buffer.from(hashedSubmittedCode, "hex");

        const codesMatch =
            storedCodeBuffer.length === submittedCodeBuffer.length &&
            crypto.timingSafeEqual(storedCodeBuffer, submittedCodeBuffer);

        if (!codesMatch) {
            const attemptsRemaining = MAX_ATTEMPTS - (pending.attempts + 1);

            await connection.query(
                `UPDATE passwordResets SET attempts = attempts + 1 WHERE id = ?`,
                [pending.id]
            );

            await connection.commit();

            return res.status(400).json({
                message:
                    attemptsRemaining > 0
                        ? `Incorrect code. ${attemptsRemaining} attempt(s) remaining.`
                        : "Incorrect code. Please request a new code.",
                issue: "invalid",
                attemptsRemaining: Math.max(attemptsRemaining, 0)
            });
        }

        await connection.query(
            `UPDATE passwordResets SET verified = 1 WHERE id = ?`,
            [pending.id]
        );
        await connection.commit();        

        return res.status(200).json({
            message: "Code has successfully verified"
        });

    } catch (err) {
        console.error(err);

        if (connection) {
            await connection.rollback();
        }

        return res.status(500).json({
            message: "Unable to connect to the server. Please try again.",
            error: err.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


export async function resetPassword(req, res) {
    const { newPassword, email } = req.body;

    const validPass = validPassword(newPassword);

    if (!newPassword || !validPass.valid) {
        return res.status(400).json({
            message: validPass.message,
            issue: validPass.issue
        });        
    }


    if (!email || typeof email !== "string") {
        return res.status(400).json({
            message: "Email is required",
            issue: "email"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    
    let connection;
    
    try {
        const [[user]] = await database.query(
            `SELECT employerID FROM employers WHERE LOWER(email) = ? LIMIT 1`,
            [normalizedEmail]
        );

        if (!user) {
            return res.status(404).json({
                message: "No account found for this email.",
                issue: "email"
            });
        }
    
        const userID = user.employerID;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        connection = await database.getConnection();
        await connection.beginTransaction();

        await connection.query(`
            UPDATE employers SET password = ? WHERE employerID = ?`,
            [hashedPassword, userID]
        );

        await connection.query(`
            DELETE FROM passwordResets WHERE userID = ? AND userType = 'employer'`,
            [userID]
        );

        await connection.commit();


        return res.status(200).json({
            message: "Password successfully reset"
        });


    } catch (err) {
        console.error(err);

        if (connection) {
            await connection.rollback();
        }

        return res.status(500).json({
            message: "Unable to connect to the server. Please try again.",
            error: err.message
        });

    } finally {
        if (connection) {
            connection.release();
        }

    }
} 