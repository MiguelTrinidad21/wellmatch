import brevo from "../../configs/brevo.js";
import crypto from "crypto";
import database from "../../configs/database.js";
import "dotenv/config"

export async function sendEmployerInvitationEmail(req, res) {
    const { email } = req.body;

    const {
        companyID,
        companyName,
        id,
        firstName,
        lastName
    } = req.user;

    const normalizedEmail = email.trim().toLowerCase();

    let connection;
    let transactionStarted = false;

    try {
        if (!email) {
            return res.status(400).json({
                message: "Employer email is required",
                issue: "missingEmail"
            });
        }

        connection = await database.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const [[{ isExistingMember }]] = await connection.query(
            `
            SELECT EXISTS (
                SELECT 1 
                FROM employers e
                JOIN companyMembers cm 
                    ON e.employerID = cm.employerID
                WHERE e.email = ?
                  AND cm.companyID = ?
                  AND cm.status = 'active'
            ) AS isExistingMember
            `,
            [normalizedEmail, companyID]
        );

        if (isExistingMember) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                message: "Employer already belongs to this company",
                issue: "isExisting"
            });
        }

        const [activeInvitation] = await connection.query(
            `
            SELECT email, companyID 
            FROM invitations 
            WHERE email = ?
              AND companyID = ?
              AND status = 'pending' 
              AND expiresAt > NOW()
            LIMIT 1
            `,
            [normalizedEmail, companyID]
        );

        if (activeInvitation.length > 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                message: "An invitation link for this employer is still active",
                issue: "activeInvitation"
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const role = "Employer";
        const status = "pending";
        const createdAt = new Date();

        const EXPIRATION_HOURS = 24;
        const expiresAt = new Date(
            Date.now() + EXPIRATION_HOURS * 60 * 60 * 1000
        );

        await connection.query(
            `
            INSERT INTO invitations (
                invitedByEmployerID,
                companyID,
                email,
                role,
                token,
                status,
                expiresAt,
                createdAt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [id, companyID, normalizedEmail, role, token, status, expiresAt, createdAt]
        );

        await connection.commit();
        transactionStarted = false;

        const inviteLink = `${process.env.FRONTEND_URL}/employer/register/invite?token=${token}`;

        await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                name: process.env.BREVO_SENDER_NAME,
                email: process.env.BREVO_SENDER_EMAIL
            },
            to: [
                {
                    email
                }
            ],
            templateId: 2,
            params: {
                inviterFirstName: firstName,
                inviterLastName: lastName,
                companyName,
                inviteLink
            }
        });

        return res.status(201).json({
            message: "Email sent successfully"
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error("Send invitation email error:", error);

        return res.status(500).json({
            message: "Sending invitation link failed",
            issue: "general"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}
