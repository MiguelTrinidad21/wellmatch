import database from "../../configs/database.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import validAddress from "../../utils/validateAddress.js";
import validPassword from "../../utils/validatePassword.js";

dotenv.config();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.PROJECT_STATUS === "production",
    sameSite: process.env.PROJECT_STATUS === "production" ? "None" : "Lax",
};

export async function registerAdmin(req, res) {
    const {
        firstName,
        lastName,
        emailAddress,
        password,
        confirmPassword,
        companyName,
        companyLocation
    } = req.body;

    let connection;

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

    try {

        connection = await database.getConnection();
        await connection.beginTransaction();

        const [existingEmployer] = await connection.query(
            `SELECT employerID FROM employers WHERE email = ?`,
            [normalizedEmail]
        );

        if (existingEmployer.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                message: "Email address is already taken",
                issue: "email"
            });
        }

        const [existingCompany] = await connection.query(
            `SELECT companyID FROM companies WHERE companyName = ?`,
            [companyName]
        )

        if (existingCompany.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                message: "Company name is already registered",
                issue: "company"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [employerResult] = await connection.query(
            `
            INSERT INTO employers 
                (email, password, firstName, lastName, status)
            VALUES 
                (?, ?, ?, ?, ?)
            `,
            [
                normalizedEmail,
                hashedPassword,
                firstName,
                lastName,
                "active"
            ]
        );

        const employerID = employerResult.insertId;

        const [companyResult] = await connection.query(
            `
            INSERT INTO companies 
                (companyName, location)
            VALUES 
                (?, ?)
            `,
            [
                companyName,
                companyLocation
            ]
        );

        const companyID = companyResult.insertId;

        await connection.query(
            `
            INSERT INTO companyMembers 
                (employerID, companyID, role, status, joinedAt)
            VALUES 
                (?, ?, ?, ?, NOW())
            `,
            [
                employerID,
                companyID,
                "Admin Employer",
                "active"
            ]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Admin employer registered successfully"
        });

    } catch (err) {
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

    let connection;

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


    try {
        if (!token) {
            return res.status(400).json({
                message: "Invitation token is required",
                issue: "token"
            });
        }

        const normalizedEmail = emailAddress.trim().toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 10);

        connection = await database.getConnection();
        await connection.beginTransaction();

        const [[employerToRegister]] = await connection.query(`
            SELECT companyID, role, email, token
            FROM invitations
            WHERE token = ?
            AND email = ?`,
            [token, normalizedEmail]
        );

        const [userExists] = await connection.query(`
            SELECT employerID
            FROM employers
            WHERE email = ?
            LIMIT 1`,
            [normalizedEmail]
        );

        const [accountIsActive] = await connection.query(`
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
            await connection.rollback();

            return res.status(409).json({
                message: "This email address is already connected to an active employer account",
                issue: "emailAddress"
            });
        }


        if (userExists.length === 0) {
            const [newEmployer] =  await connection.query(`
                INSERT INTO employers (
                    email,
                    password,
                    firstName,
                    lastName,
                    status
                )
                VALUES (?, ?, ?, ?, ?)`,
                [normalizedEmail, hashedPassword, firstName, lastName, "active"]
            );
    
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
                    newEmployer.insertId, 
                    employerToRegister.companyID,
                    employerToRegister.role
                ]
            )

        } 
        
        else {
            const [currentCompany] = await connection.query(`
                SELECT e.employerID, cm.companyID
                FROM employers e
                INNER JOIN companyMembers cm
                    ON e.employerID = cm.employerID
                WHERE e.employerID = ?
                    AND cm.companyID = ?`,
                [userExists[0].employerID, employerToRegister.companyID]
            );

            if (currentCompany.length > 0) {
                await connection.query(`
                    UPDATE employers
                    SET password = ?, firstName = ?, lastName = ?
                    WHERE email = ?`,
                    [hashedPassword, firstName, lastName, normalizedEmail]
                );
    
                await connection.query(`
                    UPDATE companyMembers
                    SET role = ?, status = 'active', joinedAt = NOW()
                    WHERE employerID = ?
                        AND companyID = ?`,
                    [
                        employerToRegister.role,
                        userExists[0].employerID, 
                        employerToRegister.companyID
                    ]
                );
    
            } else {
                await connection.query(`
                    UPDATE employers
                    SET password = ?, firstName = ?, lastName = ?
                    WHERE email = ?`,
                    [hashedPassword, firstName, lastName, normalizedEmail]
                );
    
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
                        userExists[0].employerID, 
                        employerToRegister.companyID,
                        employerToRegister.role
                    ]
                );
            }
        }

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
        if (connection) {
            await connection.rollback();
        }

        return res.status(500).json({
            message: "Unable to connect to the server. Please try again.",
            error: error.message
        });

    } finally {
        if (connection) connection.release();
    }
}