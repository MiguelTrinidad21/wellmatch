import database from "../../configs/database.js";
import bcrypt from "bcryptjs";
import crypto from "crypto"

export async function getEmployerInfo(req, res) {
    const { memberID } = req.query;
    const { id, companyID } = req.user;

    try {
        const [[employerInfo]] = await database.query(`
            SELECT
                c.compMemID,
                c.status,
                c.companyID,
                e.employerID,
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

        if (employerInfo.status === "inactive") {
            return res.status(410).json({ message: "User is deleted permanently" });
        }

        if (employerInfo.companyID !== companyID) {
            return res.status(403).json({ message: "Forbidden access" });
        }

        return res.status(200).json(employerInfo);
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fetching employer info failed" })
    }
}


export async function changePermission(req, res) {
    const { memberID, role } = req.body;
    const { companyID } = req.user;

    try {
        const [result] = await database.query(`
            UPDATE companyMembers
            SET role = ?
            WHERE compMemID = ? AND companyID = ?
        `, [role, memberID, companyID]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Member not found in your company" });
        }

        return res.status(200).json({ message: "Role updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Updating role failed" });
    }
}


export async function removeEmployer(req, res) {
    const { memberID } = req.query;
    const { companyID } = req.user;

    let connection;

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        const [[member]] = await connection.query(`
            SELECT compMemID, employerID
            FROM companyMembers
            WHERE compMemID = ? AND companyID = ?
        `, [memberID, companyID]);

        if (!member) {
            await connection.rollback();
            return res.status(404).json({ message: "Member not found in your company" });
        }


        if (member.employerID === req.user.id) {
            await connection.rollback();
            return res.status(400).json({ message: "You cannot remove your own account" });
        }

        await connection.query(`
            DELETE FROM invitations
            WHERE invitedByEmployerID = ?
                AND status = 'pending'
            `, [member.employerID]
        );

       await connection.query(`
            UPDATE companyMembers
            SET status = 'inactive'
            WHERE compMemID = ? AND companyID = ?
            `, [member.compMemID, companyID]
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
            `, [invalidHash, mmember.employerID]
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