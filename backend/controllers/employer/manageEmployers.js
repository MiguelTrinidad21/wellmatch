import database from "../../configs/database.js";
import bcrypt from "bcryptjs";
import crypto from "crypto"

export async function getEmployerInfo(req, res) {
    const { memberID } = req.query;

    try {
        const [[employerInfo]] = await database.query(`
            SELECT
                c.compMemID,
                e.firstName,
                e.lastName,
                e.email
            FROM employers e
            INNER JOIN companyMembers c
                ON e.employerID = c.employerID
            WHERE c.compMemID = ?
            `,
            [memberID]
        );

        return res.status(200).json(employerInfo);
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fetching employer info failed" })
    }
}


export async function changePermission(req, res) {
    const { memberID, role } = req.body;
    console.log(role)

    try {
        await database.query(`
            UPDATE companyMembers
            SET role = ?
            WHERE compMemID = ?
            `,
            [role, memberID]
        );

        return res.status(200).json({ message: "Role updated successfully" });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fetching employer info failed" })
    }
}


export async function removeEmployer(req, res) {
    const { memberID, companyID } = req.query;

    let connection;

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        await connection.query(`
            DELETE FROM invitations
            WHERE invitedByEmployerID = ?
                AND status = 'pending'
            `, [memberID]
        );

       await connection.query(`
            UPDATE companyMembers
            SET status = 'inactive'
            WHERE compMemID = ? AND companyID = ?
            `, [memberID, companyID]
        );

        const invalidHash = await bcrypt.hash(crypto.randomUUID(), 10);
        await connection.query(`
            UPDATE employers
            SET
                email = CONCAT('deleted_', employerID, '@removed.invalid'),
                password = ?,
                firstName = 'Deleted',
                lastName = 'User',
                status = 'deleted'
            WHERE employerID = ?
            `, [invalidHash, memberID]
        );

        await connection.commit();

        return res.status(200).json({
            message: "Employer account removed successfully"
        });
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        return res.status(500).json({ message: "Removing employer account failed" });

    } finally {
        if (connection) connection.release();        
    }
}