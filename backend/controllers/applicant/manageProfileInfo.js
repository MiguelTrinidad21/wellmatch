import database from "../../configs/database.js";
import { uploadToCloudinary } from "../../helpers/uploadToCloudinary.js";
import cloudinary from "../../configs/cloudinary.js";
import validAddress from "../../utils/validateAddress.js";

export async function addWorkExp(req, res) {
    const { id } = req.user;
    let {
        jobTitle,
        companyName,        
        startMonthLabel,   
        startYear,          
        endMonthLabel,     
        endYear
    } = req.body;

    if (!jobTitle || jobTitle.trim().length < 2 || jobTitle.trim().length > 100) {
        return res.status(400).json({
            message: "Enter a valid job title",
            issue: "invalidTitle"
        });
    }

    if (!companyName || companyName.trim().length < 2 || companyName.trim().length > 100) {
        return res.status(400).json({
            message: "Enter your previous company",
            issue: "invalidCompany"
        });
    }
    

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
                `${startMonthLabel} ${startYear}`,
                `${endMonthLabel} ${endYear}`
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
            DELETE FROM workExperiences
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
        startMonthLabel,   
        startYear,
        endMonth,          
        endMonthLabel,     
        endYear
    } = req.body;


    if (!credentialTitle || credentialTitle.trim().length < 2 || credentialTitle.trim().length > 150) {
        return res.status(400).json({
            message: "Enter a valid license or certification name",
            issue: "invalidTitle"
        })
    }

    if (!issuedBy || issuedBy.trim().length < 2 || issuedBy.trim().length > 150) {
        return res.status(400).json({
            message: "Enter a valid organization name",
            issue: "invalidOrg"
        })
    }

    let expiryDate;
    if (!endMonth || !endMonthLabel || !endYear){
        expiryDate = null;
    } else {
        expiryDate = `${endMonthLabel} ${endYear}`;
    }

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
                `${startMonthLabel} ${startYear}`,
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
            DELETE FROM credentials
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
        year,
        qualiComplete
    } = req.body;
    
    if (!courseName || courseName.trim().length < 2 || courseName.trim().length > 150) {
        return res.status(400).json({
            message: "Enter a valid college program",
            issue: "invalidTitle"
        })
    }

    if (!institution || institution.trim().length < 2 || institution.trim().length > 200) {
        return res.status(400).json({
            message: "Enter a valid educational institution",
            issue: "invalidOrg"
        })
    }

    try {
        if (qualiComplete) {
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
                    year
                ]
            );

        } else {
            await database.query(`
                INSERT INTO education (
                    applicantID,
                    courseName,
                    institution,
                    willFinishAt,
                    status
                )
                VALUES (?,?,?,?, 'active')
                `,
                [
                    id,
                    courseName,
                    institution,
                    year
                ]
            );

        }



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
            DELETE FROM education
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
            address
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

        const profilePhoto = req.file

        const [applicantRows] = await database.query(
            `
            SELECT
                email,
                profilePhotoURL, 
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
        const email = applicant.email;

        let profilePhotoURL = applicant.profilePhotoURL;
        let profilePhotoPublicID = applicant.profilePhotoPublicID;

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
                address = COALESCE(?, address),
                profilePhotoURL = COALESCE(?, profilePhotoURL),
                profilePhotoPublicID = COALESCE(?, profilePhotoPublicID)
            WHERE applicantID = ?
            `,
            [
                firstName || null,
                lastName || null,
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