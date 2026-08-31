import database from "../../configs/database.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import validAddress from "../../utils/validateAddress.js";
import validPassword from "../../utils/validatePassword.js";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail.js";

dotenv.config();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.PROJECT_STATUS === "production",
    sameSite: process.env.PROJECT_STATUS === "production" ? "None" : "Lax",
};

const CODE_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export async function registerAdmin(req, res) {
    const {
        firstName,
        lastName,
        emailAddress,
        password,
        confirmPassword,
        companyName,
        companyLocation,
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

    if (!emailAddress || emailAddress.trim().length < 5 || emailAddress.trim().length > 100) {
        return res.status(400).json({
            message: "Enter valid email address",
            issue: "email"
        });
    }

    const validPass = validPassword(password);

    if (!password || !validPass.valid) {
        return res.status(400).json({
            message: validPass.message,
            issue: validPass.issue
        });        
    }

    if (!confirmPassword || (password !== confirmPassword)) {
        return res.status(400).json({
            message: "Password did not match",
            issue: "confirmPassword"
        });
    }

    if (
        !companyName || 
        companyName.trim().length < 2 || 
        companyName.trim().length > 100
    ) {
        return res.status(400).json({
            message: "Enter a valid company name",
            issue: "invalidCompName"
        });
    }

    const trueAddress = validAddress(companyLocation);

    if (!companyLocation || !trueAddress.valid) {
        return res.status(400).json({
            message: trueAddress.reason,
            issue: trueAddress.issue
        });
    }

    const normalizedEmail = emailAddress.trim().toLowerCase();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedCompanyName = companyName.trim();
    const trimmedAddress = companyLocation.trim();


    let connection;

    try {
        const [existingEmployer] = await database.query(
            `SELECT employerID FROM employers WHERE email = ?`,
            [normalizedEmail]
        );

        if (existingEmployer.length > 0) {
            return res.status(409).json({
                message: "Email address is already taken",
                issue: "email"
            });
        }


        const [existingCompany] = await database.query(
            `SELECT companyID FROM companies WHERE companyName = ?`,
            [trimmedCompanyName]
        )

        if (existingCompany.length > 0) {
            return res.status(409).json({
                message: "Company name is already registered",
                issue: "company"
            });
        }


        const [pendingRows] = await database.query(
            `SELECT createdAt FROM pendingEmployerRegistrations WHERE email = ?`,
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
        const role = "Admin Employer";

        connection = await database.getConnection();
        await connection.beginTransaction();


        await connection.query(
            `
            INSERT INTO pendingEmployerRegistrations (
                role, 
                email,
                verificationCode,
                hashedPassword,
                firstName,
                lastName,
                companyName,
                companyLocation,
                attempts,
                expiresAt,
                createdAt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())
            ON DUPLICATE KEY UPDATE
                role             = VALUES(role),
                verificationCode = VALUES(verificationCode),
                hashedPassword   = VALUES(hashedPassword),
                firstName        = VALUES(firstName),
                lastName         = VALUES(lastName),
                companyName      = VALUES(companyName),
                companyLocation  = VALUES(companyLocation),
                attempts         = 0,
                expiresAt        = VALUES(expiresAt),
                createdAt        = NOW()
            `,
            [
                role,
                normalizedEmail,
                hashedCode,
                hashedPassword,
                trimmedFirstName,
                trimmedLastName,
                trimmedCompanyName,
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
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Failed to rollback transaction:", rollbackError);
            }
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

export async function verifyEmployerCode(req, res) {
    const { code, employerEmail } = req.body;

    if (!employerEmail || typeof employerEmail !== "string") {
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

    const normalizedEmail = employerEmail.trim().toLowerCase();
    const submittedCode = code.trim();

    let connection;    

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        // Lock the row for update to avoid race conditions
        // (e.g. two rapid submit clicks incrementing attempts inconsistently)
        const [pendingRows] = await connection.query(
            `
            SELECT *
            FROM pendingEmployerRegistrations
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
                `UPDATE pendingEmployerRegistrations SET attempts = attempts + 1 WHERE employerRegID = ?`,
                [pending.employerRegID]
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
        
        const [existingEmployer] = await connection.query(
            `SELECT employerID FROM employers WHERE email = ?`,
            [normalizedEmail]
        );

        

        if (existingEmployer.length > 0) {
            // Someone else completed registration for this email in the meantime
            await connection.query(
                `DELETE FROM pendingEmployerRegistrations WHERE employerRegID = ?`,
                [pending.employerRegID]
            );
            await connection.commit();

            return res.status(409).json({
                message: "Email address is already registered",
                issue: "email"
            });
        }

        const [newEmployer] = await connection.query(
            `
            INSERT INTO employers (
                email,
                password,
                firstName,
                lastName,                
                status
            )
            VALUES (?, ?, ?, ?, 'active')
            `,
            [
                normalizedEmail,
                pending.hashedPassword,
                pending.firstName,
                pending.lastName,
            ]
        );

        const newEmployerID = newEmployer.insertId;

        const [newCompany] = await connection.query(
            `
            INSERT INTO companies 
                (companyName, location)
            VALUES 
                (?, ?)
            `,
            [
                pending.companyName,
                pending.companyLocation
            ]
        );

        const newCompanyID = newCompany.insertId;

        await connection.query(
            `
            INSERT INTO companyMembers 
                (employerID, companyID, role, status, joinedAt)
            VALUES 
                (?, ?, ?, ?, NOW())
            `,
            [
                newEmployerID,
                newCompanyID,
                pending.role,
                "active"
            ]
        );
        // if (pending.role === "Admin Employer") {
        // } else {
        //     const [[employerToRegister]] = await connection.query(`
        //         SELECT companyID, role, email, token
        //         FROM invitations
        //         WHERE token = ?
        //         AND email = ?
        //         AND status = 'pending'
        //         AND expiresAt > NOW()`,
        //         [token, normalizedEmail]
        //     );

        //     if (!employerToRegister) {
        //         await connection.rollback();
        //         return res.status(404).json({
        //             message: "Invitation for this email does not exist",
        //             issue: "noInvitation"
        //         })
        //     }

        //     await connection.query(`
        //         INSERT INTO companyMembers (
        //             employerID,
        //             companyID,
        //             role,
        //             status,
        //             joinedAt
        //         )
        //         VALUES (?, ?, ?, "active", NOW())`,
        //         [
        //             newEmployerID, 
        //             employerToRegister.companyID,
        //             employerToRegister.role
        //         ]
        //     )

        //     await connection.query(`
        //         UPDATE invitations
        //         SET status = "accepted"
        //         WHERE token = ?
        //         AND email = ?`,
        //         [token, normalizedEmail]
        //     );                   

        // }


        await connection.commit();

        return res.status(201).json({
            message: "Employer registered successfully"
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

export async function verifyCoEmployerCode(req, res) {
    const { token } = req.params;
    const { code, employerEmail } = req.body;

    if (!employerEmail || typeof employerEmail !== "string") {
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

    const normalizedEmail = employerEmail.trim().toLowerCase();
    const submittedCode = code.trim();

    let connection;    

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        const [[employerToRegister]] = await connection.query(`
            SELECT companyID, role, email, token
            FROM invitations
            WHERE token = ?
            AND email = ?
            AND status = 'pending'
            AND expiresAt > NOW()`,
            [token, normalizedEmail]
        );

        if (!employerToRegister) {
            await connection.rollback();
            return res.status(404).json({
                message: "Invitation for this email does not exist",
                issue: "noInvitation"
            })
        }

        // Lock the row for update to avoid race conditions
        // (e.g. two rapid submit clicks incrementing attempts inconsistently)
        const [pendingRows] = await connection.query(
            `
            SELECT *
            FROM pendingEmployerRegistrations
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
                `UPDATE pendingEmployerRegistrations SET attempts = attempts + 1 WHERE employerRegID = ?`,
                [pending.employerRegID]
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
        
        const [existingEmployer] = await connection.query(
            `SELECT employerID FROM employers WHERE email = ?`,
            [normalizedEmail]
        );

        

        if (existingEmployer.length > 0) {
            // Someone else completed registration for this email in the meantime
            await connection.query(
                `DELETE FROM pendingEmployerRegistrations WHERE employerRegID = ?`,
                [pending.employerRegID]
            );
            await connection.commit();

            return res.status(409).json({
                message: "Email address is already registered",
                issue: "email"
            });
        }

        const [newEmployer] = await connection.query(
            `
            INSERT INTO employers (
                email,
                password,
                firstName,
                lastName,                
                status
            )
            VALUES (?, ?, ?, ?, 'active')
            `,
            [
                normalizedEmail,
                pending.hashedPassword,
                pending.firstName,
                pending.lastName,
            ]
        );

        const newEmployerID = newEmployer.insertId;
        

        await connection.query(`
            INSERT INTO companyMembers (
                employerID,
                companyID,
                role,
                status,
                joinedAt
            )
            VALUES (?, ?, ?, "active", NOW())`,
            [
                newEmployerID, 
                employerToRegister.companyID,
                employerToRegister.role
            ]
        )

        await connection.query(`
            UPDATE invitations
            SET status = "accepted"
            WHERE token = ?
            AND email = ?`,
            [token, normalizedEmail]
        );                   

        await connection.commit();

        return res.status(201).json({
            message: "Employer registered successfully"
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

export async function resendEmployerCode(req, res) {
    const { employerEmail } = req.body;

    if (!employerEmail || typeof employerEmail !== "string") {
        return res.status(400).json({
            message: "Email is required",
            issue: "missingEmail"
        });
    }

    const normalizedEmail = employerEmail.trim().toLowerCase();

    let connection;

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        const [pendingRows] = await connection.query(
            `
            SELECT employerRegID, createdAt
            FROM pendingEmployerRegistrations
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
            UPDATE pendingEmployerRegistrations
            SET
                verificationCode = ?,
                attempts = 0,
                expiresAt = DATE_ADD(NOW(), INTERVAL ? MINUTE),
                createdAt = NOW()
            WHERE employerRegID = ?
            `,
            [hashedCode, CODE_EXPIRY_MINUTES, pending.employerRegID]
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


export async function loginEmployer(req, res) {
    const { email, password } = req.body;

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

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const [result] = await database.query(`
        SELECT 
            e.employerID,
            e.email,
            e.password,
            e.firstName,
            e.lastName,
            cm.compMemID,
            cm.companyID,
            cm.role,
            cm.status,
            c.companyName,
            c.profilePhotoURL
        FROM employers e
        INNER JOIN companyMembers cm
            ON e.employerID = cm.employerID
        INNER JOIN companies c
            ON cm.companyID = c.companyID
        WHERE e.email = ?
            AND cm.status = 'active'
        LIMIT 1`, [normalizedEmail]);
        
        const employer = result[0];

        if (!employer) {
            return res.status(404).json({
                message: "Employer account not found",
                issue: "email"
            })
        }

        const isPassCorrect = await bcrypt.compare(password, employer.password);

        if (!isPassCorrect) {
            return res.status(401).json({
                message: "Incorrect password",
                issue: "password"
            })
        }

        const tokenPayload = {
            userType: employer.role === "Employer" ? "employer" : "admin",
            id: employer.employerID,
            compMemID: employer.compMemID,
            companyID: employer.companyID,
            role: employer.role
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        const employerInfo = {
            userType: tokenPayload.userType,
            id: employer.employerID,
            email: employer.email,
            firstName: employer.firstName,
            lastName: employer.lastName,
            compMemID: employer.compMemID,
            companyID: employer.companyID,
            companyName: employer.companyName,
            companyPhoto: employer.profilePhotoURL,
            role: employer.role
        };

        res.cookie("token", token, {
            ...cookieOptions,
            maxAge: 24 * 60 * 60 * 1000
        })
            .json({user: employerInfo}
        );

    } catch(err) {
        return res.status(500).json({
            message: "Unable to connect to the server. Please try again.",
            error: err.message
        });
    }
}

export function logoutEmployer(req, res) {
    res.clearCookie("token", cookieOptions);

    return res.status(200).json({
        message: "Logged out successfully"
    });
}



export async function verifyInvitationToken(req, res) {
    const { token } = req.params;

    try {
        if (!token) {
            return res.status(400).json({
                message: "Invitation token is required",
                issue: "noToken"
            });
        }

        const [[invitation]] = await database.query(
            `
            SELECT 
                i.invitationID,
                i.companyID,
                i.email,
                i.role,
                i.status,
                i.expiresAt,
                c.companyName,
                CASE 
                    WHEN i.expiresAt <= NOW() THEN 1
                    ELSE 0
                END AS isExpired
            FROM invitations i
            INNER JOIN companies c
                ON i.companyID = c.companyID
            WHERE i.token = ?
            LIMIT 1
            `,
            [token]
        );

        if (!invitation) {
            return res.status(404).json({
                message: "Invitation not found",
                issue: "notFound"
            });
        }

        if (invitation.status === "accepted") {
            return res.status(409).json({
                message: "Invitation already used",
                issue: "isUsed"
            });
        }

        if (invitation.status === "expired" || invitation.isExpired) {
            await database.query(
                `
                UPDATE invitations
                SET status = 'expired'
                WHERE invitationID = ?
                    AND status = 'pending'
                `,
                [invitation.invitationID]
            );

            return res.status(410).json({
                message: "Invitation has expired",
                issue: "isExpired"
            });
        }

        return res.status(200).json({
            email: invitation.email,
            role: invitation.role,
            companyName: invitation.companyName
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function registerCoEmployer(req, res) {
    const { token } = req.params;

    const {
        firstName,
        lastName,
        emailAddress,
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

    if (!emailAddress || emailAddress.trim().length < 5 || emailAddress.trim().length > 100) {
        return res.status(400).json({
            message: "Enter valid email address",
            issue: "email"
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


    if (!token) {
        return res.status(400).json({
            message: "Invitation token is required",
            issue: "token"
        });
    }

    const normalizedEmail = emailAddress.trim().toLowerCase();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    let connection;

    try {
        const [accountIsActive] = await database.query(`
            SELECT 1
            FROM employers e
            INNER JOIN companyMembers cm
                ON e.employerID = cm.employerID
            WHERE e.email = ?
                AND cm.status = 'active'
            LIMIT 1;`,
            [normalizedEmail]
        );

        if (accountIsActive.length > 0) {
            return res.status(409).json({
                message: "This email address is already connected to an active employer account",
                issue: "emailAddress"
            });
        }

        const [pendingRows] = await database.query(
            `SELECT createdAt FROM pendingEmployerRegistrations WHERE email = ?`,
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
        const role = "Employer";

        connection = await database.getConnection();
        await connection.beginTransaction();


        await connection.query(
            `
            INSERT INTO pendingEmployerRegistrations (
                role, 
                email,
                verificationCode,
                hashedPassword,
                firstName,
                lastName,
                attempts,
                expiresAt,
                createdAt
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())
            ON DUPLICATE KEY UPDATE
                role             = VALUES(role),
                verificationCode = VALUES(verificationCode),
                hashedPassword   = VALUES(hashedPassword),
                firstName        = VALUES(firstName),
                lastName         = VALUES(lastName),
                attempts         = 0,
                expiresAt        = VALUES(expiresAt),
                createdAt        = NOW()
            `,
            [
                role,
                normalizedEmail,
                hashedCode,
                hashedPassword,
                trimmedFirstName,
                trimmedLastName,
                CODE_EXPIRY_MINUTES
            ]
        );

        await connection.commit();
        
        await sendVerificationEmail(normalizedEmail, verificationCode);

        return res.status(201).json({
            message: "Verification code sent to your email",
            email: normalizedEmail
        });



    } catch (error) {
        console.error(error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Failed to rollback transaction:", rollbackError);
            }
        }

        return res.status(500).json({
            message: "Unable to connect to the server. Please try again.",
            error: error.message
        });

    } finally {
        if (connection) connection.release();
    }
}