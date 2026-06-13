import database from "../../configs/database.js";
import cloudinary from "../../configs/cloudinary.js";
import { uploadToCloudinary } from "../../helpers/uploadToCloudinary.js";


export default async function updateCompanyImages(req, res) {
    const companyID = req.user.companyID;

    try {
        const { companyName, companyLocation } = req.body;

        const profilePhoto = req.files?.profilePhoto?.[0];
        const coverPhoto = req.files?.coverPhoto?.[0];

        if (!companyName && !companyLocation && !profilePhoto && !coverPhoto) {
            return res.status(400).json({
                message: "No changes provided to update."
            });
        }

        
        const [existingCompany] = await database.query(`
            SELECT LOWER(companyName) FROM companies
            WHERE companyName = ?`,
            [companyName.toLowerCase()]
        )

        if (existingCompany[0]) {
            return res.status(409).json({
                message: "Company name is already taken",
                issue: "companyName",
                field: "companyName"
            })
        }

        

        const [companyRows] = await database.query(
            `
            SELECT 
                profilePhotoPublicID,
                coverPhotoPublicID
            FROM companies
            WHERE companyID = ?
            LIMIT 1
            `,
            [companyID]
        );

        if (companyRows.length === 0) {
            return res.status(404).json({
                message: "Company not found"
            });
        }

        const company = companyRows[0];

        let profilePhotoURL = null;
        let profilePhotoPublicID = null;
        let coverPhotoURL = null;
        let coverPhotoPublicID = null;

        if (profilePhoto) {
            if (company.profilePhotoPublicID) {
                await cloudinary.uploader.destroy(company.profilePhotoPublicID);
            }

            const uploadedProfile = await uploadToCloudinary(
                profilePhoto.buffer,
                "wellmatch/company/profilePhoto"
            );

            profilePhotoURL = uploadedProfile.secure_url;
            profilePhotoPublicID = uploadedProfile.public_id;
        }

        if (coverPhoto) {
            if (company.coverPhotoPublicID) {
                await cloudinary.uploader.destroy(company.coverPhotoPublicID);
            }

            const uploadedCover = await uploadToCloudinary(
                coverPhoto.buffer,
                "wellmatch/company/coverPhoto"
            );

            coverPhotoURL = uploadedCover.secure_url;
            coverPhotoPublicID = uploadedCover.public_id;
        }

        await database.query(
            `
            UPDATE companies
            SET
                companyName = COALESCE(?, companyName),
                location = COALESCE(?, location),
                profilePhotoURL = COALESCE(?, profilePhotoURL),
                profilePhotoPublicID = COALESCE(?, profilePhotoPublicID),
                coverPhotoURL = COALESCE(?, coverPhotoURL),
                coverPhotoPublicID = COALESCE(?, coverPhotoPublicID)
            WHERE companyID = ?
            `,
            [
                companyName || null,
                companyLocation || null,
                profilePhotoURL,
                profilePhotoPublicID,
                coverPhotoURL,
                coverPhotoPublicID,
                companyID
            ]
        );

        const updatedFields = {
            profilePhotoURL,
            coverPhotoURL,
            companyName,
            location: companyLocation
        };

        const cleanFields = Object.fromEntries(
            Object.entries(updatedFields).filter(([_, value]) => value !== null)
        );

        return res.status(200).json({
            message: "Company profile updated successfully",
            cleanFields
        });

    } catch (error) {
        console.error("UPDATE COMPANY DETAILS ERROR:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
}