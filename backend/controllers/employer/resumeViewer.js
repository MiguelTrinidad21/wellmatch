import database from "../../configs/database.js";
import cloudinary from "../../configs/cloudinary.js";
import axios from "axios";


export async function viewResume(req, res) {
    const resumeID = req.params.resumeID;
    const { companyID } = req.user;

    try {
        const [[rows]] = await database.query(`
            SELECT r.cloudinaryPublicID, r.origFileName
            FROM resumes r
            INNER JOIN applications a ON a.resumeID = r.resumeID
            INNER JOIN jobs j ON j.jobID = a.jobID
            WHERE r.resumeID = ?
                AND j.companyID = ?
            LIMIT 1
            `, [resumeID, companyID]
        );

        if (!rows) {
            return res.status(404).json({ message: "Resume not found" });
        }

        const { cloudinaryPublicID, origFileName } = rows;


        const cloudinaryResource = await cloudinary.api.resource(cloudinaryPublicID, {
            resource_type: 'raw',
            type: 'authenticated',
        });

        const fileUrl = cloudinaryResource.secure_url;
        console.log("Streaming from:", fileUrl);


        const fileResponse = await axios.get(fileUrl, { responseType: 'stream' });

        const isDocx = origFileName?.toLowerCase().endsWith('.docx');

        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Disposition', `inline; filename="${origFileName}"`);
        res.setHeader('Content-Type', isDocx
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf'
        );


        fileResponse.data.pipe(res);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Viewing resume failed" });
    }
}