import database from "../../configs/database.js";

export async function getCompany(req, res) {
    const companyID = req.query.companyID;

    try {
        const [companyInfo] = await database.query(`
            SELECT * FROM companies
            WHERE companyID = ?`,
            [companyID]
        );

        if (companyInfo.length === 0) {
            return res.status(404).json({ message: "Company not found" });
        }

        return res.status(200).json(companyInfo[0]);

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: error});
    }
}

export async function getCompanyMembers(req, res) {
    const { companyID, employerID} = req.query;

    try {
        const [companyMembers] = await database.query(`
            SELECT cm.compMemID, e.employerID, e.email, e.firstName, e.lastName, cm.role, cm.joinedAt
            FROM employers e
            INNER JOIN companyMembers cm
            ON e.employerID = cm.employerID
            WHERE cm.companyID = ?
            AND cm.status = "active"
            ORDER BY (e.employerID = ?) DESC, cm.joinedAt ASC`,
            [companyID, employerID]
        );

        if (companyMembers.length === 0) {
            return res.status(404).json({ message: "Company members not found" });
        }

        return res.status(200).json({companyMembers});

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: error});
    }
}