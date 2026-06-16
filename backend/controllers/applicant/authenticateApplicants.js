import database from "../../configs/database.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { uploadResume } from "../../helpers/uploadToCloudinary.js";
import { processResume, generateFileHash } from "../../helpers/resumeExtractor.js";

export async function registerApplicant(req, res) {
    const {
        firstName,
        lastName,
        address,
        email,
        password
    } = req.body;

    const resume = req.file;

    if (!resume) {
        return res.status(400).json({
            message: "Resume is required",
            issue: "noResume"
        });
    }

    let connection;
    let uploadedResume = null;

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const [existingApplicant] = await database.query(
            `SELECT applicantID FROM applicants WHERE email = ? LIMIT 1`,
            [normalizedEmail]
        );

        if (existingApplicant.length > 0) {
            return res.status(409).json({
                message: "*Email address is already registered",
                issue: "email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        uploadedResume = await uploadResume(
            resume.buffer,
            "wellmatch/applicant/resume",
            resume.originalname
        );

        if (!uploadedResume) {
            return res.status(500).json({
                message: "Uploading resume failed"
            });
        }

        connection = await database.getConnection();
        await connection.beginTransaction();

        const [applicantResult] = await connection.query(
            `
            INSERT INTO applicants 
                (email, password, firstName, lastName, address, createdAt)
            VALUES 
                (?, ?, ?, ?, ?, NOW())
            `,
            [
                normalizedEmail,
                hashedPassword,
                firstName,
                lastName,
                address
            ]
        );

        const applicantID = applicantResult.insertId;
        const fileHash = generateFileHash(resume.buffer);

        const [newResume] = await connection.query(
            `
            INSERT INTO resumes (
                applicantID,
                cloudinaryPublicID,
                origFileName,
                isDefault,
                uploadedAt,
                resumeStatus,
                fileHash
            )
            VALUES (?, ?, ?, TRUE, NOW(), 'processing', ?)
            `,
            [
                applicantID,
                uploadedResume.public_id,
                resume.originalname,
                fileHash
            ]
        );
 
        await connection.commit();
        
        processResume(resume, newResume.insertId).catch(async (error) => {
            console.error("Resume extraction failed:", error);

            try {
                await database.query(`
                    UPDATE resumes
                    SET resumeStatus = 'failed'
                    WHERE resumeID = ?
                    `,
                    [newResume.insertId]
                )
                
            } catch (dbError) {
                console.error("Failed to update resume status:", dbError);
            }
        })
        
        return res.status(201).json({
            message: "Applicant user has registered successfully"
        });

    } catch (err) {
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

    } catch(err) {
        return res.status(500).json({
            message: "Unable to connect to the server. Please try again.",
            error: err.message
        });
    }
}

export function logoutApplicant(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "Lax"
    });

    return res.status(200).json({
        message: "Logged out successfully"
    });
}