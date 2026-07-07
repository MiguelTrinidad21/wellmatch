import database from "../../configs/database.js";
import cloudinary from "../../configs/cloudinary.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
import crypto from "crypto"


export async function changeEmail(req, res) {
    const { id } = req.user;
    const { email, password } = req.body;
    console.log(password)

    const normalizedEmail = email.trim().toLowerCase();

    const [existingApplicant] = await database.query(`
        SELECT email, password
        FROM applicants 
        WHERE email = ?
        LIMIT 1`,
        [normalizedEmail]
    );

    if (existingApplicant.length > 0) {
        return res.status(409).json({
            message: "Email address is already taken",
            issue: "sameEmail"
        });
    }

    const [[currentUser]] = await database.query(`
        SELECT *
        FROM applicants 
        WHERE applicantID = ?
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
            UPDATE applicants
            SET email = ?
            WHERE applicantID = ?
            `,
            [normalizedEmail, id]
        );

        const [[applicant]] = await database.query(`
            SELECT * 
            FROM applicants
            WHERE applicantID = ?
            LIMIT 1
            `,
            [id]
        );

        const applicantInfo = {
            userType: "applicant",
            id: applicant.applicantID,
            email: applicant.email,
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            address: applicant.address,
            profilePhoto: applicant.profilePhotoURL
        };

        const token = jwt.sign(
            applicantInfo, 
            process.env.JWT_SECRET,
            {expiresIn: "1d"}
        )

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, //Set to true for production
            sameSite: "Lax", //Set to "None" for production
            maxAge: 24 * 60 * 60 * 1000
        })
            .json({user: applicantInfo}
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

        // Fix #5 — correct FK for recommendedJobs
        await connection.query(`
            DELETE FROM recommendedJobs
            WHERE resumeID IN (SELECT resumeID FROM resumes WHERE applicantID = ?)
            `, [id]
        );

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
            UPDATE credentials SET status = 'deleted' WHERE applicantID = ?`, [id]);

        await connection.query(`
            UPDATE workExperiences SET status = 'deleted' WHERE applicantID = ?`, [id]);

        await connection.query(`
            UPDATE education SET status = 'deleted' WHERE applicantID = ?`, [id]);

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