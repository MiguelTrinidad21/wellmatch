import database from "../../configs/database.js";
import cloudinary from "../../configs/cloudinary.js";
import axios from "axios";


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