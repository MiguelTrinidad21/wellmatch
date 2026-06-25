import database from "../../configs/database.js";
import cloudinary from "../../configs/cloudinary.js";
import { uploadResume } from "../../helpers/uploadToCloudinary.js";
import { processResume, generateFileHash } from "../../helpers/resumeExtractor.js";
import axios from "axios";

export async function uploadAndAddResume(req, res) {
    const resume = req.file;

    if (!resume) {
        return res.status(400).json({
            message: "Resume is required",
            issue: "noResume"
        });
    }

    const fileHash = generateFileHash(resume.buffer);
    const { id } = req.user;

    let connection;
    let uploadedResume = null;

    try {
        connection = await database.getConnection();

        const [existingResumeRows] = await connection.query(
            `
            SELECT resumeID, resumeStatus, cloudinaryPublicID
            FROM resumes
            WHERE applicantID = ?
            AND fileHash = ?
            LIMIT 1
            `,
            [id, fileHash]
        );

        const existingResume = existingResumeRows[0];

        if (existingResume?.resumeStatus === "active") {
            return res.status(409).json({
                message: "Resume already uploaded",
                issue: "existingResume"
            });
        }

        const [allActiveResumes] = await connection.query(
            `
            SELECT resumeID
            FROM resumes
            WHERE applicantID = ?
            AND resumeStatus = 'active'
            `,
            [id]
        );

        if (allActiveResumes.length === 5) {
            return res.status(403).json({
                message: "Uploaded resumes should not exceed five files",
                issue: "fileLimit"
            });
        }

        if (existingResume?.resumeStatus === "processing") {
            return res.status(409).json({
                message: "This resume is already being processed",
                issue: "resumeProcessing"
            });
        }

        // Fix 1: Skip Cloudinary upload if resume was previously deleted
        // Reuse the existing Cloudinary file instead of uploading a duplicate
        if (existingResume?.resumeStatus === "deleted") {
            uploadedResume = { public_id: existingResume.cloudinaryPublicID };
        } else {
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
        }

        const shouldProcessResume =
            !existingResume || existingResume.resumeStatus === "failed";

        const nextResumeStatus =
            existingResume?.resumeStatus === "deleted"
                ? "active"
                : "processing";

        await connection.beginTransaction();

        // Fix 2: Use nextResumeStatus in the INSERT instead of hardcoded 'processing'
        // so deleted resumes get inserted/updated with 'active' correctly
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
            VALUES (?, ?, ?, FALSE, NOW(), ?, ?)
            ON DUPLICATE KEY UPDATE
                resumeID = LAST_INSERT_ID(resumeID),
                cloudinaryPublicID = VALUES(cloudinaryPublicID),
                origFileName = VALUES(origFileName),
                resumeStatus = ?,
                uploadedAt = NOW();
            `,
            [
                id,
                uploadedResume.public_id,
                resume.originalname,
                nextResumeStatus,   // Fix 2: was hardcoded 'processing' before
                fileHash,
                nextResumeStatus
            ]
        );

        await connection.commit();

        const resumeID = newResume.insertId;

        if (shouldProcessResume) {
            try {
                await processResume(resume, resumeID);
            } catch (error) {
                console.error("Resume extraction failed:", error);

                await database.query(
                    `
                    UPDATE resumes
                    SET resumeStatus = 'failed'
                    WHERE resumeID = ?
                    `,
                    [resumeID]
                );

                // Fix 3: Guard with res.headersSent to prevent double response
                if (!res.headersSent) {
                    return res.status(500).json({
                        message: "Resume uploaded, but AI processing failed.",
                        issue: "resumeProcessingFailed"
                    });
                }
                return;
            }
        }

        // Fix 4: Use connection instead of database to stay consistent
        const [[resumeToAnalyze]] = await connection.query(
            `
            SELECT
                resumeID,
                applicantID,
                origFileName,
                isDefault,
                uploadedAt,
                resumeStatus
            FROM resumes
            WHERE resumeID = ?
            AND resumeStatus = 'active'
            LIMIT 1
            `,
            [resumeID]
        );

        if (!resumeToAnalyze) {
            if (!res.headersSent) {
                return res.status(500).json({
                    message: "Resume was uploaded but was not activated after processing.",
                    issue: "resumeNotActive"
                });
            }
            return;
        }

        return res.status(existingResume ? 200 : 201).json({
            message: existingResume
                ? "Resume reactivated successfully"
                : "New resume uploaded and processed successfully",
            resumeToAnalyze
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error(error);

        // Fix 3: Guard with res.headersSent to prevent double response (ECONNRESET)
        if (!res.headersSent) {
            return res.status(500).json({
                message: "Unable to connect to the server. Please try again.",
                error: error.message
            });
        }

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

export async function getAllResumes(req, res) {
    const { id } = req.user;

    try {
        const [allResumes] = await database.query(`
            SELECT *
            FROM resumes
            WHERE applicantID = ?
            AND resumeStatus = 'active'
            ORDER BY isDefault DESC, resumeID DESC
            `,
            [id]
        );

        return res.status(200).json({ allResumes });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fetching all resumes failed" })
    }
}

export async function viewResume(req, res) {
    const resumeID = req.params.resumeID;

    try {
        const [[rows]] = await database.query(`
            SELECT cloudinaryPublicID, origFileName
            FROM resumes
            WHERE resumeID = ?
            `, [resumeID]
        );

        if (!rows) {
            return res.status(404).json({ message: "Resume not found" });
        }

        const { cloudinaryPublicID, origFileName } = rows;

        // ✅ Use Cloudinary Admin API to get the actual secure_url with version
        const cloudinaryResource = await cloudinary.api.resource(cloudinaryPublicID, {
            resource_type: 'raw',
            type: 'upload',
        });

        const fileUrl = cloudinaryResource.secure_url;
        console.log("Streaming from:", fileUrl);

        // ✅ Backend fetches from Cloudinary
        const fileResponse = await axios.get(fileUrl, { responseType: 'stream' });

        const isDocx = origFileName?.toLowerCase().endsWith('.docx');

        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Disposition', `inline; filename="${origFileName}"`);
        res.setHeader('Content-Type', isDocx
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf'
        );

        // ✅ Stream directly to frontend — URL never exposed
        fileResponse.data.pipe(res);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Viewing resume failed" });
    }
}

export async function makeResumeDefault(req, res) {
    const { id } = req.user;
    const { resumeID } = req.query;
    console.log(resumeID)

    let connection;

    try {
        connection = await database.getConnection();

        await connection.beginTransaction();

        await connection.query(`
            UPDATE resumes
            SET isDefault = 0
            WHERE applicantID = ?
            `,
            [id]
        );

        await connection.query(`
            UPDATE resumes
            SET isDefault = 1
            WHERE applicantID = ?
            AND resumeID = ?
            `,
            [id, resumeID]
        );

        await connection.commit();
        return res.status(200).json({ message: "Successfully updated default resume" });

    } catch (error) {
        if (connection) {
            console.error(error);
            await connection.rollback();
            return res.status(500).json({ message: "Failed to update default resume" });
        }        
    } finally {
        if (connection) {
            connection.release();
        }        
    }
}

export async function deleteResume(req, res) {
    const { id } = req.user;
    const { resumeID } = req.query;

    try {
        

        await database.query(`
            UPDATE resumes
            SET resumeStatus = 'deleted'
            WHERE resumeID = ?
            AND applicantID = ?
            `,
            [resumeID, id]
        );

        return res.status(200).json({ message: "Deleted resume successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete resume" });
    }
}

export async function debugResume(req, res) {
    try {
        const config = cloudinary.config();
        const publicId = 'wellmatch/applicant/resume/Allysa_Nicole_H_Trinidad_CV_1781481084084.PDF';

        // Try both types and see which one finds it
        let resultAuthenticated = null;
        let resultUpload = null;
        let errorAuthenticated = null;
        let errorUpload = null;

        try {
            resultAuthenticated = await cloudinary.api.resource(publicId, {
                resource_type: 'raw',
                type: 'authenticated',
            });
        } catch (e) {
            errorAuthenticated = e.message;
        }

        try {
            resultUpload = await cloudinary.api.resource(publicId, {
                resource_type: 'raw',
                type: 'upload',
            });
        } catch (e) {
            errorUpload = e.message;
        }

        return res.json({
            authenticated: resultAuthenticated ?? `ERROR: ${errorAuthenticated}`,
            upload: resultUpload ?? `ERROR: ${errorUpload}`,
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}