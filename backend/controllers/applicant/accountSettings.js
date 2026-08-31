import database from "../../configs/database.js";
import cloudinary from "../../configs/cloudinary.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendEmailUpdateCode } from "../../utils/sendVerificationEmail.js";
import validPassword from "../../utils/validatePassword.js";

const CODE_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;


const cookieOptions = {
    httpOnly: true,
    secure: process.env.PROJECT_STATUS === "production",
    sameSite: process.env.PROJECT_STATUS === "production" ? "None" : "Lax",
};


export async function changeEmail(req, res) {
    const { id } = req.user;
    const { email, prevEmail, password } = req.body;

    if (!email || typeof email !== "string") {
        return res.status(400).json({
            message: "Enter a valid email address",
            issue: "email"
        });
    }

    if (!prevEmail || typeof prevEmail !== "string") {
        return res.status(400).json({
            message: "Enter your current email address",
            issue: "email"
        });
    }

    if (!password) {
        return res.status(400).json({
            message: "Enter your password",
            issue: "password"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPrevEmail = prevEmail.trim().toLowerCase();

    if (normalizedEmail === normalizedPrevEmail) {
        return res.status(400).json({
            message: "Enter a new email address",
            issue: "email"
        });
    }

    let connection;

    try {
        const [[currentUser]] = await database.query(
            `SELECT * FROM applicants WHERE applicantID = ? LIMIT 1`,
            [id]
        );

        if (!currentUser) {
            return res.status(404).json({
                message: "Account not found",
                issue: "notFound"
            });
        }

        // Verify identity first — fail fast before revealing anything else
        const isPassCorrect = await bcrypt.compare(password, currentUser.password);

        if (!isPassCorrect) {
            return res.status(400).json({
                message: "Incorrect password",
                issue: "password"
            });
        }

        // Confirm they actually know their CURRENT email, not just any string
        if (normalizedPrevEmail !== currentUser.email.toLowerCase()) {
            return res.status(400).json({
                message: "Current email address does not match our records",
                issue: "email"
            });
        }

        // Check the new email isn't already taken by a confirmed account
        const [existingApplicant] = await database.query(
            `SELECT applicantID FROM applicants WHERE email = ? LIMIT 1`,
            [normalizedEmail]
        );

        if (existingApplicant.length > 0) {
            return res.status(409).json({
                message: "Email address is already taken",
                issue: "email"
            });
        }

        // Cooldown check — scoped to THIS account's own pending request
        const [pendingRows] = await database.query(
            `SELECT createdAt FROM pendingEmailChanges WHERE userID = ? AND userType = 'applicant'`,
            [id]
        );

        if (pendingRows.length > 0) {
            const secondsSinceLastSend =
                (Date.now() - new Date(pendingRows[0].createdAt).getTime()) / 1000;

            if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
                const secondsRemaining = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
                return res.status(429).json({
                    message: `Please wait ${secondsRemaining} second(s) before requesting another code`,
                    issue: "cooldown",
                    secondsRemaining
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
            INSERT INTO pendingEmailChanges (
                userID,
                userType,
                newEmail,
                verificationCode,
                attempts,
                expiresAt,
                createdAt
            )
            VALUES (?, 'applicant', ?, ?, 0, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())
            ON DUPLICATE KEY UPDATE
                newEmail         = VALUES(newEmail),
                verificationCode = VALUES(verificationCode),
                attempts         = 0,
                expiresAt        = VALUES(expiresAt),
                createdAt        = NOW()
            `,
            [
                id,
                normalizedEmail,
                hashedCode,
                CODE_EXPIRY_MINUTES
            ]
        );

        await connection.commit();

        await sendEmailUpdateCode(normalizedEmail, verificationCode);

        return res.status(201).json({
            message: "Verification code sent to your new email",
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

export async function verifyEmailUpdateCode(req, res) {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.PROJECT_STATUS === "production",
        sameSite: process.env.PROJECT_STATUS === "production" ? "None" : "Lax",
    };

    const { id } = req.user;
    const { code } = req.body;

    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
        return res.status(400).json({
            message: "Enter a valid 6-digit code",
            issue: "invalid"
        });
    }

    const submittedCode = code.trim();

    let connection;

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        const [pendingRows] = await connection.query(
            `
            SELECT *
            FROM pendingEmailChanges
            WHERE userID = ? AND userType = 'applicant'
            FOR UPDATE
            `,
            [id]
        );

        if (pendingRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "No pending email change request found. Please submit a new request.",
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
                `UPDATE pendingEmailChanges SET attempts = attempts + 1 WHERE id = ?`,
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

        // 4. Code correct — re-check the new email hasn't been taken by a parallel request
        const [existingApplicant] = await connection.query(
            `SELECT applicantID FROM applicants WHERE email = ?`,
            [pending.newEmail]
        );

        if (existingApplicant.length > 0) {
            await connection.query(
                `DELETE FROM pendingEmailChanges WHERE id = ?`,
                [pending.id]
            );
            await connection.commit();

            return res.status(409).json({
                message: "Email address is already registered",
                issue: "email"
            });
        }

        // 5. Apply the email change
        await connection.query(
            `UPDATE applicants SET email = ? WHERE applicantID = ?`,
            [pending.newEmail, id]
        );

        const [[applicant]] = await connection.query(
            `SELECT * FROM applicants WHERE applicantID = ? LIMIT 1`,
            [id]
        );

        // 6. Clean up the pending row
        await connection.query(
            `DELETE FROM pendingEmailChanges WHERE id = ?`,
            [pending.id]
        );

        await connection.commit();

        // 7. Re-issue token with the updated email — build payload after commit succeeds
        const applicantInfo = {
            userType: "applicant",
            id: applicant.applicantID,
            email: applicant.email,
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            address: applicant.address,
            profilePhoto: applicant.profilePhotoURL
        };

        const tokenPayload = {
            userType: "applicant",
            id: applicant.applicantID
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res
            .cookie("token", token, {
                ...cookieOptions,
                maxAge: 24 * 60 * 60 * 1000
            })
            .status(200)
            .json({ message: "Email address updated successfully", user: applicantInfo });

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

export async function resendEmailUpdateCode(req, res) {
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
            SELECT id, createdAt
            FROM pendingEmailChanges
            WHERE newEmail = ?
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
            UPDATE pendingEmailChanges
            SET
                verificationCode = ?,
                attempts = 0,
                expiresAt = DATE_ADD(NOW(), INTERVAL ? MINUTE),
                createdAt = NOW()
            WHERE id = ?
            `,
            [hashedCode, CODE_EXPIRY_MINUTES, pending.id]
        );

        await connection.commit();

        // Send the new code outside the transaction
        await sendEmailUpdateCode(normalizedEmail, verificationCode);

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


export async function changePassword(req, res) {
    const { id } = req.user;
    const { currentPassword, newPassword, retypePassword } = req.body;

    if (!currentPassword) {
        return res.status(400).json({
            message: "Enter your current password",
            issue: "incorrectPass"
        });
    }

    const validPass = validPassword(newPassword);

    if (!newPassword || !validPass.valid) {
        return res.status(400).json({
            message: validPass.message,
            issue: "invalidPass"
        });
    }

    if (!retypePassword || newPassword !== retypePassword) {
        return res.status(400).json({
            message: "Password did not match",
            issue: "notMatch"
        });
    }

    try {
        const [[applicant]] = await database.query(`
            SELECT password
            FROM applicants
            WHERE applicantID = ?
            LIMIT 1
            `,
            [id]
        );

        const isPassCorrect = await bcrypt.compare(currentPassword, applicant.password);

        if (!isPassCorrect) {
            return res.status(400).json({
                message: "Incorrect password",
                issue: "incorrectPass"
            })
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "Pick a new password",
                issue: "invalidPass"
            })
        }

        if (newPassword !== retypePassword) {
            return res.status(400).json({
                message: "Password did not match",
                issue: "notMatch"
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await database.query(`
            UPDATE applicants
            SET password = ?
            WHERE applicantID =?
            `,
            [hashedPassword, id]
        );

        return res.json(200).json({ message: "Password changed successfully" })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Changing password failed" })
    }
}


export async function deleteAccount(req, res) {
    const { id } = req.user;
    const { email, password } = req.query; // Fix #6

    let connection;

    try {
        const [[user]] = await database.query(`
            SELECT email, password, profilePhotoPublicID
            FROM applicants
            WHERE applicantID = ?
            `, [id]
        );

        if (!user) { // Fix #7
            return res.status(404).json({
                message: "Account not found",
                issue: "general"
            });
        }

        const reqEmail = email.trim().toLowerCase();
        const userEmail = user.email.trim().toLowerCase();
        const isPassCorrect = await bcrypt.compare(password, user.password);

        if (reqEmail !== userEmail) {
            return res.status(400).json({
                message: "Incorrect email address",
                issue: "email"
            });
        }

        if (!isPassCorrect) {
            return res.status(400).json({
                message: "Incorrect password",
                issue: "password"
            });
        }

        const [resumeRows] = await database.query(`
            SELECT resumeID, cloudinaryPublicID
            FROM resumes
            WHERE applicantID = ?
            `, [id]
        );

        // Fix #4 — Cloudinary deletions outside transaction
        for (const item of resumeRows) {
            try {
                if (item.cloudinaryPublicID) {
                    await cloudinary.uploader.destroy(item.cloudinaryPublicID, {
                        resource_type: "raw"
                    });
                }
            } catch (err) {
                console.error(`Failed to delete resume file: ${item.cloudinaryPublicID}`, err);
            }
        }

        if (user.profilePhotoPublicID) {
            try {
                await cloudinary.uploader.destroy(user.profilePhotoPublicID);
            } catch (err) {
                console.error('Failed to delete profile photo', err);
            }
        }

        connection = await database.getConnection();
        await connection.beginTransaction();

        // Delete resumeSkillsEmbeddings
        for (const item of resumeRows) {
            await connection.query(`
                DELETE FROM resumeSkillsEmbeddings WHERE resumeID = ?
                `, [item.resumeID]
            );
        }

        await connection.query(`
            DELETE FROM savedJobs WHERE applicantID = ?`, [id]);

        // Soft delete resumes
        await connection.query(`
            UPDATE resumes
            SET resumeStatus = 'deleted', cloudinaryPublicID = NULL
            WHERE applicantID = ?
            `, [id]
        );

        // Fix #3 — soft delete instead of hard delete
        await connection.query(`
            DELETE FROM credentials WHERE applicantID = ?`, [id]);

        await connection.query(`
            DELETE FROM workExperiences WHERE applicantID = ?`, [id]);

        await connection.query(`
            DELETE FROM education WHERE applicantID = ?`, [id]);

        await connection.query(`
            UPDATE applications
            SET status = 'withdraw'
            WHERE applicantID = ?
            AND status IN ('submitted', 'shortlisted', 'interview')
        `, [id]);

        
        const invalidHash = await bcrypt.hash(crypto.randomUUID(), 10);
        await connection.query(`
            UPDATE applicants
            SET
                email = CONCAT('deleted_', applicantID, '@removed.invalid'),
                password = ?,
                firstName = 'Deleted',
                lastName = 'User',
                profilePhotoURL = NULL,
                profilePhotoPublicID = NULL,
                address = NULL,
                status = 'deleted'
            WHERE applicantID = ?
            `, [invalidHash, id]
        );

        await connection.commit(); // Fix #2

        res.clearCookie("token", cookieOptions);

        return res.status(200).json({ // Fix #1
            message: "Account deleted successfully"
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        return res.status(500).json({
            message: "Account deletion failed",
            issue: "general"
        });
    } finally {
        if (connection) connection.release();
    }
}