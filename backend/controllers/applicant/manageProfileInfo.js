import database from "../../configs/database.js";
import { uploadToCloudinary } from "../../helpers/uploadToCloudinary.js";
import cloudinary from "../../configs/cloudinary.js";

export async function addWorkExp(req, res) {
    const { id } = req.user;
    let {
        jobTitle,
        companyName,
        startDate,
        endDate
    } = req.body;

    endDate = (endDate === "") ? null : endDate;

    try {
        await database.query(`
            INSERT INTO workExperiences (
                applicantID,
                jobTitle,
                companyName,
                startDate,
                endDate,
                status
            )
            VALUES (?,?,?,?,?, 'active')
            `,
            [
                id,
                jobTitle,
                companyName,
                startDate,
                endDate
            ]
        );

        return res.status(201).json({ message: "Work experience added successfully" });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Failed to add work experience"});
    }
}

export async function getAllWorkExp(req, res) {
    const { id } = req.user;

    try {
        const [rows] = await database.query(`
            SELECT *
            FROM workExperiences
            WHERE applicantID = ?
            AND status = 'active'
            `,
            [id]
        );

        return res.status(200).json({ workExperiences: rows });

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Fetching all work experiences failed"});
    }
}

export async function deleteWorkExp(req, res) {
    const { id } = req.user;
    const { workExpID } = req.query;
    console.log(workExpID)

    try {
        await database.query(`
            UPDATE workExperiences
            SET status = 'deleted'
            WHERE workExpID = ?
            AND applicantID = ?
            `,
            [workExpID, id]
        );

        return res.status(200).json({ message: "Successfully deleted work experience" })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Deleting work experience failed" })
    }
}




export async function addCredential(req, res) {
    const { id } = req.user;
    let {
        credentialTitle,
        issuedBy,
        issueDate,
        expiryDate
    } = req.body;

    expiryDate = (expiryDate === "") ? null : expiryDate;

    try {
        await database.query(`
            INSERT INTO credentials (
                applicantID,
                credentialTitle,
                issuedBy,
                issueDate,
                expiryDate,
                status
            )
            VALUES (?,?,?,?,?, 'active')
            `,
            [
                id,
                credentialTitle,
                issuedBy,
                issueDate,
                expiryDate
            ]
        );

        return res.status(201).json({ message: "Credential added successfully" });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Failed to add credential"});
    }
}

export async function getCredentials(req, res) {
    const { id } = req.user;

    try {
        const [rows] = await database.query(`
            SELECT *
            FROM credentials
            WHERE applicantID = ?
            AND status = 'active'
            `,
            [id]
        );

        return res.status(200).json({ credentials: rows });

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Fetching all credentials failed"});
    }
}

export async function deleteCredential(req, res) {
    const { id } = req.user;
    const { credID } = req.query;

    try {
        await database.query(`
            UPDATE credentials
            SET status = 'deleted'
            WHERE credentialID = ?
            AND applicantID = ?
            `,
            [credID, id]
        );

        return res.status(200).json({ message: "Successfully deleted credential" })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Deleting credential failed" })
    }
}

export async function addEducation(req, res) {
    const { id } = req.user;
    let {
        courseName,
        institution,
        graduatedAt
    } = req.body;

    graduatedAt = (graduatedAt === "") ? null : graduatedAt;

    try {
        await database.query(`
            INSERT INTO education (
                applicantID,
                courseName,
                institution,
                graduatedAt,
                status
            )
            VALUES (?,?,?,?, 'active')
            `,
            [
                id,
                courseName,
                institution,
                graduatedAt
            ]
        );

        return res.status(201).json({ message: "Education added successfully" });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to add education"});
    }
}

export async function getEducation(req, res) {
    const { id } = req.user;

    try {
        const [rows] = await database.query(`
            SELECT *
            FROM education
            WHERE applicantID = ?
            AND status = 'active'
            `,
            [id]
        );

        return res.status(200).json({ education: rows });

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Fetching all education failed"});
    }
}

export async function deleteEducation(req, res) {
    const { id } = req.user;
    const { educID } = req.query;

    try {
        await database.query(`
            UPDATE education
            SET status = 'deleted'
            WHERE educationID = ?
            AND applicantID = ?
            `,
            [educID, id]
        );

        return res.status(200).json({ message: "Successfully deleted education" })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Deleting education failed" })
    }
}



export async function updateInfo(req, res) {
    try {
        const { id } = req.user;

        const {
            firstName,
            lastName,
            email,
            prevEmail,
            address
        } = req.body;

        const profilePhoto = req.file

        if (prevEmail !== email) {
            const [existingEmail] = await database.query(`
                SELECT LOWER(email) FROM applicants
                WHERE email = ?`,
                [email.toLowerCase()]
            )

            if (existingEmail[0]) {
                return res.status(409).json({
                    message: "Email address is already taken",
                    issue: "email",
                    field: "email"
                })
            }
        }

        const [applicantRows] = await database.query(
            `
            SELECT 
                profilePhotoPublicID
            FROM applicants
            WHERE applicantID = ?
            LIMIT 1
            `,
            [id]
        );

        if (applicantRows.length === 0) {
            return res.status(404).json({
                message: "Applicant account not found"
            });
        }

        const applicant = applicantRows[0];

        let profilePhotoURL = null;
        let profilePhotoPublicID = null;

        if (profilePhoto) {
            if (applicant.profilePhotoPublicID) {
                await cloudinary.uploader.destroy(applicant.profilePhotoPublicID);
            }

            const uploadedProfile = await uploadToCloudinary(
                profilePhoto.buffer,
                "wellmatch/applicant/profilePhoto"
            );

            profilePhotoURL = uploadedProfile.secure_url;
            profilePhotoPublicID = uploadedProfile.public_id;
        }
        
        await database.query(
            `
            UPDATE applicants
            SET
                firstName = COALESCE(?, firstName),
                lastName = COALESCE(?, lastName),
                email = COALESCE(?, email),
                address = COALESCE(?, address),
                profilePhotoURL = COALESCE(?, profilePhotoURL),
                profilePhotoPublicID = COALESCE(?, profilePhotoPublicID)
            WHERE applicantID = ?
            `,
            [
                firstName || null,
                lastName || null,
                email|| null,
                address || null,
                profilePhotoURL,
                profilePhotoPublicID,
                id
            ]
        );

        const updatedInfo = {
            userType: "applicant",
            id,
            email,
            firstName,
            lastName,
            address,
            profilePhoto: profilePhotoURL
        };

        return res.status(200).json({
            message: "Applicant profile updated successfully",
            user: updatedInfo
        });
        
    } catch (error) {
        console.error("UPDATE APPLICANT DETAILS ERROR:", error);

        return res.status(500).json({
            message: "Server error"
        });        
    }
}