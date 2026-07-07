import database from "../../configs/database.js";


export async function updateStatus(req, res) {
    const { applicationID, nextStatus } = req.body;
    const toHire = nextStatus === "hired"

    try {
        await database.query(`
            UPDATE applications
            SET 
                status = ?
                ${toHire ? ", dateHired = NOW()" : ""}
            WHERE applicationID = ?
            `,
            [nextStatus, applicationID]
        );

        return res.status(200).json({ message: `Application status updated to ${nextStatus}` });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Updating application status failed" });
    }
}


export async function rejectApplicant(req, res) {
    const { applicationID } = req.body;

    try {
        await database.query(`
            UPDATE applications
            SET status = 'not selected'
            WHERE applicationID = ?
            `,
            [applicationID]
        );

        return res.status(200).json({ message: "Job application rejected successfully" });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Rejecting job application failed" });
    }
}

export async function rejectAllApplicants(req, res) {
    const { currentStatus } = req.body;

    try {
        await database.query(`
            UPDATE applications
            SET status = 'not selected'
            WHERE status = ?
            `,
            [currentStatus]
        );

        return res.status(200).json({ message: "All job applicationa rejected successfully" });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Rejecting all job applications failed" });
    }
}

