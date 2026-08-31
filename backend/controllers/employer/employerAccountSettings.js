import database from "../../configs/database.js";
import cloudinary from "../../configs/cloudinary.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import validPassword from "../../utils/validatePassword.js";
import { sendEmailUpdateCode } from "../../utils/sendVerificationEmail.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.PROJECT_STATUS === "production",
    sameSite: process.env.PROJECT_STATUS === "production" ? "None" : "Lax",
};

const CODE_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export async function updatePersonalDetails(req, res) {
    const { 
        id, 
        userType,
        compMemID,
        companyID,
        role
    } = req.user;

    const { 
        firstName,
        lastName,
        prevEmail,
        email, 
        password 
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

    if (!email) {
        return res.status(400).json({
            message: "Enter a valid email address",
            issue: "noEmail"
        });
    }

    if (!prevEmail) {
        return res.status(400).json({
            message: "No previous email address provided",
            issue: "noPrevEmail"
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
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const emailChanged = normalizedEmail !== normalizedPrevEmail;

    let connection;

    try {
        const [[currentUser]] = await database.query(`
            SELECT email, password
            FROM employers 
            WHERE employerID = ?
            LIMIT 1`,
            [id]
        );

        if (!currentUser) {
            return res.status(404).json({
                message: "Account not found",
                issue: "notFound"
            });
        }

        // Verify identity first — before revealing anything about email availability
        const isPassCorrect = await bcrypt.compare(password, currentUser.password);

        if (!isPassCorrect) {
            return res.status(400).json({
                message: "Incorrect password",
                issue: "password"
            });
        }

        // Confirm prevEmail actually matches their current email on record
        if (normalizedPrevEmail !== currentUser.email.toLowerCase()) {
            return res.status(400).json({
                message: "Previous email address does not match our records",
                issue: "noPrevEmail"
            });
        }

        if (emailChanged) {
            const [existingEmployer] = await database.query(`
                SELECT employerID
                FROM employers 
                WHERE email = ?`,
                [normalizedEmail]
            );

            if (existingEmployer.length > 0) {
                return res.status(409).json({
                    message: "Email address is already taken",
                    issue: "sameEmail"
                });
            }
        }

        connection = await database.getConnection();
        await connection.beginTransaction();

        // ALWAYS update firstName/lastName immediately, regardless of email change
        await connection.query(`
            UPDATE employers
            SET 
                firstName = ?,
                lastName = ?
            WHERE employerID = ?
            `,
            [trimmedFirstName, trimmedLastName, id]
        );

        if (emailChanged) {
            // Email changed — don't touch the email column yet.
            // Queue a pending email change and send a verification code instead.

            const [pendingRows] = await connection.query(
                `SELECT createdAt FROM pendingEmailChanges WHERE userID = ? AND userType = 'employer' FOR UPDATE`,
                [id]
            );

            if (pendingRows.length > 0) {
                const secondsSinceLastSend =
                    (Date.now() - new Date(pendingRows[0].createdAt).getTime()) / 1000;

                if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
                    await connection.rollback();
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
                VALUES (?, 'employer', ?, ?, 0, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())
                ON DUPLICATE KEY UPDATE
                    newEmail         = VALUES(newEmail),
                    verificationCode = VALUES(verificationCode),
                    attempts         = 0,
                    expiresAt        = VALUES(expiresAt),
                    createdAt        = NOW()
                `,
                [id, normalizedEmail, hashedCode, CODE_EXPIRY_MINUTES]
            );

            await connection.commit();

            await sendEmailUpdateCode(normalizedEmail, verificationCode);

            return res.status(200).json({
                message: "Name updated. A verification code has been sent to your new email address.",
                emailChangePending: true,
                newEmail: normalizedEmail
            });
        }

        // Email unchanged — normal path, commit name update and refresh the JWT
        await connection.commit();

        const [[employer]] = await database.query(`
            SELECT *
            FROM employers
            WHERE employerID = ?
            LIMIT 1
            `,
            [id]
        );

        const [[company]] = await database.query(`
            SELECT companyName, profilePhotoURL AS companyPhoto
            FROM companies WHERE companyID = ? LIMIT 1
            `,
            [companyID]
        );

        const employerInfo = {
            userType,
            id,
            email: employer.email,
            firstName: employer.firstName,
            lastName: employer.lastName,
            compMemID,
            companyID,
            companyName: company.companyName,
            companyPhoto: company.companyPhoto,
            role
        };

        const tokenPayload = {
            userType,
            id,
            compMemID,
            companyID,
            role
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
            .json({ message: "Details updated successfully", user: employerInfo, emailChangePending: false });

    } catch (error) {
        console.error(error);

        if (connection) {
            await connection.rollback();
        }

        return res.status(500).json({
            message: "Unable to update details. Please try again.",
            error: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

export async function verifyEmailUpdateCode(req, res) {
    const { id, companyID, userType, role, compMemID } = req.user;
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
            WHERE userID = ? AND userType = 'employer'
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
            `SELECT employerID FROM employers WHERE email = ?`,
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
            `UPDATE employers SET email = ? WHERE employerID = ?`,
            [pending.newEmail, id]
        );

        
        // 6. Clean up the pending row
        await connection.query(
            `DELETE FROM pendingEmailChanges WHERE id = ?`,
            [pending.id]
        );
        
        await connection.commit();
        
        // 7. Re-issue token with the updated email — build payload after commit succeeds
        
        const [[employer]] = await connection.query(
            `SELECT * FROM employers WHERE employerID = ? LIMIT 1`,
            [id]
        );

        const [[company]] = await database.query(`
            SELECT companyName, profilePhotoURL AS companyPhoto
            FROM companies WHERE companyID = ? LIMIT 1
            `,
            [companyID]
        );

        const employerInfo = {
            userType,
            id,
            email: employer.email,
            firstName: employer.firstName,
            lastName: employer.lastName,
            compMemID,
            companyID,
            companyName: company.companyName,
            companyPhoto: company.companyPhoto,
            role
        };

        const tokenPayload = {
            userType,
            id,
            compMemID,
            companyID,
            role
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
            .json({ message: "Details updated successfully", user: employerInfo, emailChangePending: false });

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
    const { id } = req.user; // trust the authenticated session, not a client-supplied email

    let connection;

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        const [pendingRows] = await connection.query(
            `
            SELECT id, newEmail, createdAt
            FROM pendingEmailChanges
            WHERE userID = ? AND userType = 'employer'
            FOR UPDATE
            `,
            [id]
        );

        if (pendingRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "No pending email change request found. Please submit a new request.",
                issue: "notFound"
            });
        }

        const pending = pendingRows[0];

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

        await sendEmailUpdateCode(pending.newEmail, verificationCode);

        return res.status(200).json({
            message: "A new verification code has been sent to your new email address",
            email: pending.newEmail
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

    if (currentPassword === newPassword) {
        return res.status(400).json({
            message: "Pick a new password",
            issue: "invalidPass"
        })
    }

    if (!retypePassword || newPassword !== retypePassword) {
        return res.status(400).json({
            message: "Password did not match",
            issue: "notMatch"
        });
    }

    try {
        const [[employer]] = await database.query(`
            SELECT password
            FROM employers
            WHERE employerID = ?
            LIMIT 1
            `,
            [id]
        );

        if (!employer) {
            return res.status(404).json({
                message: "Account not found",
                issue: "general"
            });
        }

        const isPassCorrect = await bcrypt.compare(currentPassword, employer.password);

        if (!isPassCorrect) {
            return res.status(400).json({
                message: "Incorrect password",
                issue: "incorrectPass"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await database.query(`
            UPDATE employers
            SET password = ?
            WHERE employerID = ?
            `,
            [hashedPassword, id]
        );

        return res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Changing password failed" });
    }
}


// export async function deleteAccount(req, res) {
//     const { id, companyID, userType } = req.user;
//     const { email, password } = req.query;

//     if (!email || email.trim().length < 5 || email.trim().length > 100) {
//         return res.status(400).json({
//             message: "Enter valid email address",
//             issue: "email"
//         });
//     }

//     if (!password) {
//         return res.status(400).json({
//             message: "Enter your password",
//             issue: "password"
//         });        
//     }


//     let connection;

//     try {
//         const [[employer]] = await database.query(`
//             SELECT email, password
//             FROM employers
//             WHERE employerID = ?
//             LIMIT 1
//             `, [id]
//         );

//         if (!employer) {
//             return res.status(404).json({
//                 message: "Account not found",
//                 issue: "general"
//             });
//         }

//         const reqEmail = email.trim().toLowerCase();
//         const employerEmail = employer.email.trim().toLowerCase();
//         const isPassCorrect = await bcrypt.compare(password, employer.password);

//         if (reqEmail !== employerEmail) {
//             return res.status(400).json({
//                 message: "Incorrect email address",
//                 issue: "email"
//             });
//         }

//         if (!isPassCorrect) {
//             return res.status(400).json({
//                 message: "Incorrect password",
//                 issue: "password"
//             });
//         }

//         // Fetch members once and reuse — Fix #1
//         let allMembers = [];
//         let totalAdmins = 0;

//         if (userType === 'admin') {
//             const [members] = await database.query(`
//                 SELECT *
//                 FROM companyMembers
//                 WHERE companyID = ?
//                     AND status = 'active'
//                 `, [companyID]
//             );

//             allMembers = members;
//             totalAdmins = allMembers.filter(m => m.role === 'Admin Employer').length;

//             // Block if only admin and other members exist — Fix #2
//             if (allMembers.length >= 2 && totalAdmins === 1) {
//                 return res.status(403).json({
//                     message: "Assign a new admin before proceeding",
//                     issue: "adminCount"
//                 });
//             }

//             // Last member — handle Cloudinary before transaction — Fix #3
//             if (allMembers.length === 1 && totalAdmins === 1) {
//                 const [[companyPhotos]] = await database.query(`
//                     SELECT profilePhotoPublicID, coverPhotoPublicID
//                     FROM companies WHERE companyID = ?
//                     `, [companyID]
//                 );

//                 if (companyPhotos?.profilePhotoPublicID) {
//                     try {
//                         await cloudinary.uploader.destroy(companyPhotos.profilePhotoPublicID);
//                     } catch (err) {
//                         console.error('Failed to delete company profile photo', err);
//                     }
//                 }

//                 if (companyPhotos?.coverPhotoPublicID) {
//                     try {
//                         await cloudinary.uploader.destroy(companyPhotos.coverPhotoPublicID);
//                     } catch (err) {
//                         console.error('Failed to delete company cover photo', err);
//                     }
//                 }
//             }
//         }


//         connection = await database.getConnection();
//         await connection.beginTransaction();

//         if (userType === 'admin' && allMembers.length === 1 && totalAdmins === 1) {
//             await connection.query(`
//                 DELETE FROM jobSkillEmbeddings
//                 WHERE jobID IN (
//                     SELECT jobID FROM jobs WHERE companyID = ?
//                 )`, [companyID]
//             );

//             await connection.query(`
//                 DELETE sj
//                 FROM savedJobs sj
//                 INNER JOIN jobs j
//                 ON sj.jobID = j.jobID
//                 WHERE j.companyID = ?
//                 `,
//                 [companyID]
//             );

//             await connection.query(`
//                 UPDATE jobs SET status = 'deleted'
//                 WHERE companyID = ?
//                 `, [companyID]
//             );

//             await connection.query(`
//                 DELETE FROM invitations
//                 WHERE companyID = ?
//                 `, [companyID]
//             );

//             await connection.query(`
//                 UPDATE companies
//                 SET
//                     companyName = CONCAT('DeletedCompany_', companyID),
//                     location = NULL,
//                     profilePhotoURL = NULL,
//                     profilePhotoPublicID = NULL,
//                     coverPhotoURL = NULL,
//                     coverPhotoPublicID = NULL,
//                     status = 'deleted'
//                 WHERE companyID = ?
//                 `, [companyID]
//             );
//         }

//         // Fix #3 — delete pending invitations sent by this employer
//         await connection.query(`
//             DELETE FROM invitations
//             WHERE invitedByEmployerID = ?
//                 AND status = 'pending'
//             `, [id]
//         );

//         await connection.query(`
//             UPDATE companyMembers
//             SET status = 'inactive'
//             WHERE employerID = ? AND companyID = ?
//             `, [id, companyID]
//         );

//         const invalidHash = await bcrypt.hash(crypto.randomUUID(), 10);
//         await connection.query(`
//             UPDATE employers
//             SET
//                 email = CONCAT('deleted_', employerID, '@removed.invalid'),
//                 password = ?,
//                 firstName = 'Deleted',
//                 lastName = 'User',
//                 status = 'deleted'
//             WHERE employerID = ?
//             `, [invalidHash, id]
//         );

//         await connection.commit();

//         res.clearCookie("token", {...cookieOptions});
        
//         return res.status(200).json({
//             message: "Employer account deleted successfully"
//         });

//     } catch (error) {
//         if (connection) await connection.rollback();
//         console.error(error);
//         return res.status(500).json({ message: "Deleting account failed" });
//     } finally {
//         if (connection) connection.release();
//     }
// }

export async function deleteAccount(req, res) {
    const { id, companyID, role } = req.user; // added `role`
    const { email, password } = req.body; // moved from req.query to req.body

    if (!email || email.trim().length < 5 || email.trim().length > 100) {
        return res.status(400).json({
            message: "Enter valid email address",
            issue: "email"
        });
    }

    if (!password) {
        return res.status(400).json({
            message: "Enter your password",
            issue: "password"
        });
    }

    let connection;

    try {
        const [[employer]] = await database.query(`
            SELECT email, password
            FROM employers
            WHERE employerID = ?
            LIMIT 1
            `, [id]
        );

        if (!employer) {
            return res.status(404).json({
                message: "Account not found",
                issue: "general"
            });
        }

        const reqEmail = email.trim().toLowerCase();
        const employerEmail = employer.email.trim().toLowerCase();

        if (reqEmail !== employerEmail) {
            return res.status(400).json({
                message: "Incorrect email address",
                issue: "email"
            });
        }

        const isPassCorrect = await bcrypt.compare(password, employer.password);

        if (!isPassCorrect) {
            return res.status(400).json({
                message: "Incorrect password",
                issue: "password"
            });
        }

        // Fetch members once and reuse
        let allMembers = [];
        let totalAdmins = 0;
        const isAdmin = role === 'Admin Employer'; // fixed: check role, not userType

        if (isAdmin) {
            const [members] = await database.query(`
                SELECT *
                FROM companyMembers
                WHERE companyID = ?
                    AND status = 'active'
                `, [companyID]
            );

            allMembers = members;
            totalAdmins = allMembers.filter(m => m.role === 'Admin Employer').length;

            // Block if only admin and other members exist
            if (allMembers.length >= 2 && totalAdmins === 1) {
                return res.status(403).json({
                    message: "Assign a new admin before proceeding",
                    issue: "adminCount"
                });
            }

            // Last member — handle Cloudinary before transaction
            if (allMembers.length === 1 && totalAdmins === 1) {
                const [[companyPhotos]] = await database.query(`
                    SELECT profilePhotoPublicID, coverPhotoPublicID
                    FROM companies WHERE companyID = ?
                    `, [companyID]
                );

                if (companyPhotos?.profilePhotoPublicID) {
                    try {
                        await cloudinary.uploader.destroy(companyPhotos.profilePhotoPublicID);
                    } catch (err) {
                        console.error('Failed to delete company profile photo', err);
                    }
                }

                if (companyPhotos?.coverPhotoPublicID) {
                    try {
                        await cloudinary.uploader.destroy(companyPhotos.coverPhotoPublicID);
                    } catch (err) {
                        console.error('Failed to delete company cover photo', err);
                    }
                }
            }
        }

        connection = await database.getConnection();
        await connection.beginTransaction();

        if (isAdmin && allMembers.length === 1 && totalAdmins === 1) {
            await connection.query(`
                DELETE FROM jobSkillEmbeddings
                WHERE jobID IN (
                    SELECT jobID FROM jobs WHERE companyID = ?
                )`, [companyID]
            );

            await connection.query(`
                DELETE sj
                FROM savedJobs sj
                INNER JOIN jobs j
                ON sj.jobID = j.jobID
                WHERE j.companyID = ?
                `,
                [companyID]
            );

            await connection.query(`
                UPDATE jobs SET status = 'deleted'
                WHERE companyID = ?
                `, [companyID]
            );

            await connection.query(`
                DELETE FROM invitations
                WHERE companyID = ?
                `, [companyID]
            );

            await connection.query(`
                UPDATE companies
                SET
                    companyName = CONCAT('DeletedCompany_', companyID),
                    location = NULL,
                    profilePhotoURL = NULL,
                    profilePhotoPublicID = NULL,
                    coverPhotoURL = NULL,
                    coverPhotoPublicID = NULL,
                    status = 'deleted'
                WHERE companyID = ?
                `, [companyID]
            );
        }

        // Delete pending invitations sent by this employer
        await connection.query(`
            DELETE FROM invitations
            WHERE invitedByEmployerID = ?
                AND status = 'pending'
            `, [id]
        );

        await connection.query(`
            UPDATE companyMembers
            SET status = 'inactive'
            WHERE employerID = ? AND companyID = ?
            `, [id, companyID]
        );

        const invalidHash = await bcrypt.hash(crypto.randomUUID(), 10);
        await connection.query(`
            UPDATE employers
            SET
                email = CONCAT('deleted_', employerID, '@removed.invalid'),
                password = ?,
                firstName = 'Deleted',
                lastName = 'User',
                status = 'deleted'
            WHERE employerID = ?
            `, [invalidHash, id]
        );

        await connection.commit();

        res.clearCookie("token", { ...cookieOptions });

        return res.status(200).json({
            message: "Employer account deleted successfully"
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        return res.status(500).json({ message: "Deleting account failed" });
    } finally {
        if (connection) connection.release();
    }
}