import database from "../../configs/database.js";
import cloudinary from "../../configs/cloudinary.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";


export async function updatePersonalDetails(req, res) {
    const { 
        id, 
        userType,
        compMemID,
        companyID,
        companyName,
        companyPhoto,
        role
     } = req.user;

    const { 
        firstName,
        lastName,
        prevEmail,
        email, 
        password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPrevEmail = prevEmail.trim().toLowerCase();

    if (normalizedEmail !== normalizedPrevEmail) {
        const [existingApplicant] = await database.query(`
            SELECT email, password
            FROM employers 
            WHERE email = ?`,
            [normalizedEmail]
        );
    
        if (existingApplicant.length > 0) {
            return res.status(409).json({
                message: "Email address is already taken",
                issue: "sameEmail"
            });
        }
    }


    const [[currentUser]] = await database.query(`
        SELECT password
        FROM employers 
        WHERE employerID = ?
        LIMIT 1`,
        [id]
    );    

    const isPassCorrect = await bcrypt.compare(password, currentUser.password);

    if (!isPassCorrect) {
        return res.status(401).json({
            message: "Incorrect password",
            issue: "password"
        })
    }

    try {
        await database.query(`
            UPDATE employers
            SET 
                firstName = ?,
                lastName = ?,
                email = ?
            WHERE employerID = ?
            `,
            [firstName, lastName, normalizedEmail, id]
        );

        const [[employer]] = await database.query(`
            SELECT *
            FROM employers
            WHERE employerID = ?
            LIMIT 1
            `,
            [id]
        );

        const employerInfo = {
            userType,
            id,
            email: employer.email,
            firstName: employer.firstName,
            lastName: employer.lastName,
            compMemID,
            companyID,
            companyName,
            companyPhoto,
            role
        };

        const token = jwt.sign(
            employerInfo, 
            process.env.JWT_SECRET,
            {expiresIn: "1d"}
        )

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, //Set to true for production
            sameSite: "Lax", //Set to "None" for production
            maxAge: 24 * 60 * 60 * 1000
        })
            .json({user: employerInfo}
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Unable to update user's email. Please try again.",
            error: error.message
        });        
    }
}

export async function changePassword(req, res) {
    const { id } = req.user;
    const { currentPassword, newPassword, retypePassword } = req.body;

    try {
        const [[employer]] = await database.query(`
            SELECT password
            FROM employers
            WHERE employerID = ?
            LIMIT 1
            `,
            [id]
        );

        const isPassCorrect = await bcrypt.compare(currentPassword, employer.password);

        if (!isPassCorrect) {
            return res.status(401).json({
                message: "Incorrect password",
                issue: "incorrectPass"
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
            UPDATE employers
            SET password = ?
            WHERE employerID =?
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
    const { id, companyID, userType } = req.user;
    const { email, password } = req.query;

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
        const isPassCorrect = await bcrypt.compare(password, employer.password);

        if (reqEmail !== employerEmail) {
            return res.status(401).json({
                message: "Incorrect email address",
                issue: "email"
            });
        }

        if (!isPassCorrect) {
            return res.status(401).json({
                message: "Incorrect password",
                issue: "password"
            });
        }

        // Fetch members once and reuse — Fix #1
        let allMembers = [];
        let totalAdmins = 0;

        if (userType === 'admin') {
            const [members] = await database.query(`
                SELECT *
                FROM companyMembers
                WHERE companyID = ?
                    AND status = 'active'
                `, [companyID]
            );

            allMembers = members;
            totalAdmins = allMembers.filter(m => m.role === 'Admin Employer').length;

            // Block if only admin and other members exist — Fix #2
            if (allMembers.length >= 2 && totalAdmins === 1) {
                return res.status(403).json({
                    message: "Assign a new admin before proceeding",
                    issue: "adminCount"
                });
            }

            // Last member — handle Cloudinary before transaction — Fix #3
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

        if (userType === 'admin' && allMembers.length === 1 && totalAdmins === 1) {
            await connection.query(`
                DELETE FROM jobSkillEmbeddings
                WHERE jobID IN (
                    SELECT jobID FROM jobs WHERE companyID = ?
                )`, [companyID]
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
                    companyName = 'Deleted Company',
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

        // Fix #3 — delete pending invitations sent by this employer
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