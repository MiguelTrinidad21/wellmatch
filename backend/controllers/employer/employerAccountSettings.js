import e from "express";
import database from "../../configs/database.js";


export async function editDetails(req, res) {
    const { firstName, lastName, email } = req.body;
    const employerID = req.user.id;

    try {
        const [existingEmail] = await database.query(`
            SELECT *
            FROM employers
            WHERE email = ?
            `,
            [email]
        )

        if (existingEmail.length > 0) {
            return res.status(500).json({
                issue: "email",
                message: "Email address already exists"
            })
        }


        await database.query(`
            UPDATE employers
            SET firstName = ?, lastName = ?, email = ?
            WHERE employerID = ?
        `,
        [firstName, lastName, email, employerID]
        );

        return res.status(200).json({ message: "Profile details updated successfully" })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Updating profile details failed.", issue: "general" })
    }
}