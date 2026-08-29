import database from "../../configs/database.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import "dotenv/config";
import jwt from "jsonwebtoken";
import validAddress from "../../utils/validateAddress.js";
import validPassword from "../../utils/validatePassword.js";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.PROJECT_STATUS === "production",
    sameSite: process.env.PROJECT_STATUS === "production" ? "None" : "Lax",
};

const CODE_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export async function registerApplicant(req, res) {
    const {
        firstName,
        lastName,
        address,
        email,
        password,
        confirmPass
    } = req.body;
    
    if (!firstName || firstName.trim().length < 2 || firstName.trim().length > 50) {
        return res.status(400).json({
            message: "Enter valid first name",
            issue: "invalidFName"
        });
    }

    if (!lastName || lastName.trim().length < 2 || lastName.trim().length > 50) {
        return res.status(400).json({
            message: "Enter valid last name",
            issue: "invalidLName"
        });
    }

    const trueAddress = validAddress(address);

    if (!address || (!trueAddress.valid)) {
        return res.status(400).json({
            message: trueAddress.reason,
            issue: trueAddress.issue
        });
    }

    const validPass = validPassword(password);

    if (!password || !validPass.valid) {
        return res.status(400).json({
            message: validPass.message,
            issue: validPass.issue
        });        
    }

    if (!confirmPass || (password !== confirmPass)) {
        return res.status(400).json({
            message: "Password did not match",
            issue: "confirmPassword"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedAddress = address.trim();

    let connection;


    try {
        const [existingApplicant] = await database.query(`
            SELECT applicantID FROM applicants WHERE email = ?`,
            [normalizedEmail]
        );

        if (existingApplicant.length > 0) {
            return res.status(409).json({
                message: "Email address is already taken",
                issue: "email"
            });
        }




        const [pendingRows] = await database.query(
            `SELECT createdAt FROM pendingApplicantRegistrations WHERE email = ?`,
            [normalizedEmail]
        );

        if (pendingRows.length > 0) {
            const secondsSinceLastSend =
                (Date.now() - new Date(pendingRows[0].createdAt).getTime()) / 1000;

            if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
                return res.status(429).json({
                    message: `Please wait before requesting another code`,
                    issue: "cooldown"
                });
            }
        }



        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const hashedCode = crypto
            .createHash("sha256")
            .update(verificationCode)
            .digest("hex");

        const hashedPassword = await bcrypt.hash(password, 10);

        connection = await database.getConnection();
        await connection.beginTransaction();

        await connection.query(
            `
            INSERT INTO pendingApplicantRegistrations (
                email,
                verificationCode,
                hashedPassword,
                firstName,
                lastName,
                address,
                attempts,
                expiresAt,
                createdAt
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())
            ON DUPLICATE KEY UPDATE
                verificationCode = VALUES(verificationCode),
                hashedPassword   = VALUES(hashedPassword),
                firstName        = VALUES(firstName),
                lastName         = VALUES(lastName),
                address          = VALUES(address),
                attempts         = 0,
                expiresAt        = VALUES(expiresAt),
                createdAt        = NOW()
            `,
            [
                normalizedEmail,
                hashedCode,
                hashedPassword,
                trimmedFirstName,
                trimmedLastName,
                trimmedAddress,
                CODE_EXPIRY_MINUTES
            ]
        );

        await connection.commit();
        
        await sendVerificationEmail(normalizedEmail, verificationCode);

        return res.status(201).json({
            message: "Verification code sent to your email",
            email: normalizedEmail
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

export async function verifyApplicantCode(req, res) {
    const { code, applicantEmail } = req.body;

    if (!applicantEmail || typeof applicantEmail !== "string") {
        return res.status(400).json({
            message: "Email is required",
            issue: "missingEmail"
        });
    }
    
    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
        return res.status(400).json({
            message: "Enter a valid 6-digit code",
            issue: "invalid"
        });
    }

    const normalizedEmail = applicantEmail.trim().toLowerCase();
    const submittedCode = code.trim();

    let connection;

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        // Lock the row for update to avoid race conditions
        // (e.g. two rapid submit clicks incrementing attempts inconsistently)
        const [pendingRows] = await connection.query(
            `
            SELECT
                applicantRegID,
                verificationCode,
                hashedPassword,
                firstName,
                lastName,
                address,
                attempts,
                expiresAt
            FROM pendingApplicantRegistrations
            WHERE email = ?
            FOR UPDATE
            `,
            [normalizedEmail]
        );

        if (pendingRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "No pending registration found for this email. Please register again.",
                issue: "invalid"
            });
        }

        const pending = pendingRows[0];

        // 1. Check lockout FIRST — consistent behavior regardless of code correctness
        if (pending.attempts >= MAX_ATTEMPTS) {
            await connection.rollback();
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new code.",
                issue: "invalid"
            });
        }

        // 2. Check expiry
        const isExpired = new Date(pending.expiresAt).getTime() < Date.now();

        if (isExpired) {
            await connection.rollback();
            return res.status(410).json({
                message: "This code has expired. Please request a new code.",
                issue: "invalid"
            });
        }

        // 3. Check code match (hash the submitted code, compare using timing-safe comparison)
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
                `UPDATE pendingApplicantRegistrations SET attempts = attempts + 1 WHERE applicantRegID = ?`,
                [pending.applicantRegID]
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

        // 4. Code is correct — double-check email wasn't registered by a parallel request
        const [existingApplicant] = await connection.query(
            `SELECT applicantID FROM applicants WHERE email = ?`,
            [normalizedEmail]
        );

        if (existingApplicant.length > 0) {
            // Someone else completed registration for this email in the meantime
            await connection.query(
                `DELETE FROM pendingApplicantRegistrations WHERE applicantRegID = ?`,
                [pending.applicantRegID]
            );
            await connection.commit();

            return res.status(409).json({
                message: "Email address is already registered",
                issue: "email"
            });
        }

        // 5. Create the real applicant account
        const [insertResult] = await connection.query(
            `
            INSERT INTO applicants (
                firstName,
                lastName,
                address,
                email,
                password,
                createdAt
            )
            VALUES (?, ?, ?, ?, ?, NOW())
            `,
            [
                pending.firstName,
                pending.lastName,
                pending.address,
                normalizedEmail,
                pending.hashedPassword
            ]
        );

        // 6. Clean up the pending row — no longer needed
        await connection.query(
            `DELETE FROM pendingApplicantRegistrations WHERE applicantRegID = ?`,
            [pending.applicantRegID]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Account verified and registered successfully"
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

export async function resendApplicantCode(req, res) {
    const { applicantEmail } = req.body;

    if (!applicantEmail || typeof applicantEmail !== "string") {
        return res.status(400).json({
            message: "Email is required",
            issue: "missingEmail"
        });
    }

    const normalizedEmail = applicantEmail.trim().toLowerCase();

    let connection;

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        const [pendingRows] = await connection.query(
            `
            SELECT applicantRegID, createdAt
            FROM pendingApplicantRegistrations
            WHERE email = ?
            FOR UPDATE
            `,
            [normalizedEmail]
        );

        if (pendingRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "No pending registration found for this email. Please register again.",
                issue: "notFound"
            });
        }

        const pending = pendingRows[0];

        // Cooldown check — prevent spamming resend
        const secondsSinceLastSend =
            (Date.now() - new Date(pending.createdAt).getTime()) / 1000;

        if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
            await connection.rollback();
            const secondsRemaining = Math.ceil(
                RESEND_COOLDOWN_SECONDS - secondsSinceLastSend
            );

            return res.status(429).json({
                message: `Please wait ${secondsRemaining} second(s) before requesting another code.`,
                issue: "cooldown",
                secondsRemaining
            });
        }

        // Generate a fresh code, reset attempts, extend expiry
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const hashedCode = crypto
            .createHash("sha256")
            .update(verificationCode)
            .digest("hex");

        await connection.query(
            `
            UPDATE pendingApplicantRegistrations
            SET
                verificationCode = ?,
                attempts = 0,
                expiresAt = DATE_ADD(NOW(), INTERVAL ? MINUTE),
                createdAt = NOW()
            WHERE applicantRegID = ?
            `,
            [hashedCode, CODE_EXPIRY_MINUTES, pending.applicantRegID]
        );

        await connection.commit();

        // Send the new code outside the transaction
        await sendVerificationEmail(normalizedEmail, verificationCode);

        return res.status(200).json({
            message: "A new verification code has been sent to your email",
            email: normalizedEmail
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

export async function loginApplicant(req, res) {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (!email) {
        return res.status(400).json({
            message: "Enter your email address",
            issue: "email"
        });
    }

    if (!password) {
        return res.status(400).json({
            message: "Enter your password",
            issue: "password"
        });        
    }

    try {
        const [result] = await database.query(`
        SELECT *
        FROM applicants
        WHERE email = ?
        AND status = 'active'
        LIMIT 1`, [normalizedEmail]);
        
        const applicant = result[0];

        if (!applicant) {
            return res.status(404).json({
                message: "User not found",
                issue: "email"
            })
        }

        const isPassCorrect = await bcrypt.compare(password, applicant.password);

        if (!isPassCorrect) {
            return res.status(401).json({
                message: "Incorrect password",
                issue: "password"
            })
        }

        const tokenPayload = {
            userType: "applicant",
            id: applicant.applicantID
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        const applicantInfo = {
            userType: "applicant",
            id: applicant.applicantID,
            email: applicant.email,
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            address: applicant.address,
            profilePhoto: applicant.profilePhotoURL
        };

        res.cookie("token", token, {
            ...cookieOptions,
            maxAge: 24 * 60 * 60 * 1000
        })
            .json({user: applicantInfo}
        );

    } catch(err) {
        return res.status(500).json({
            message: "Unable to connect to the server. Please try again.",
            error: err.message
        });
    }
}

export function logoutApplicant(req, res) {
    res.clearCookie("token", cookieOptions);

    return res.status(200).json({
        message: "Logged out successfully"
    });
}