import database from "../../configs/database.js";
import bcrypt from "bcryptjs";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { uploadResume } from "../../helpers/uploadToCloudinary.js";
import { processResume, generateFileHash } from "../../helpers/resumeExtractor.js";
import validAddress from "../../utils/validateAddress.js";
import validPassword from "../../utils/validatePassword.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.PROJECT_STATUS === "production",
    sameSite: process.env.PROJECT_STATUS === "production" ? "None" : "Lax",
};


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
        const [existingApplicant] = await database.query(`
            SELECT applicantID, status 
            FROM applicants 
            WHERE email = ?`,
            [normalizedEmail]
        );

        if (existingApplicant.length > 0) {
            return res.status(409).json({
                message: "Email address is already taken",
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
                (email, password, firstName, lastName, address, createdAt, status)
            VALUES 
                (?, ?, ?, ?, ?, NOW(), 'active')
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