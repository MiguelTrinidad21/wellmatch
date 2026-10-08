import database from "../../configs/database.js";
import brevo from "../../configs/brevo.js";
import "dotenv/config";

async function applicationBelongsToCompany(applicationID, companyID) {
    const [[row]] = await database.query(`
        SELECT 1 AS ok
        FROM applications ap
        INNER JOIN jobs j ON ap.jobID = j.jobID
        WHERE ap.applicationID = ?
          AND j.companyID = ?
        LIMIT 1
    `, [applicationID, companyID]);
    return Boolean(row);
}

export async function updateStatus(req, res) {
    const { applicationID, nextStatus } = req.body;
    const { companyID } = req.user;

    const ALLOWED_STATUSES = ["shortlisted", "interview", "hired"];
    if (!ALLOWED_STATUSES.includes(nextStatus)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        if (!(await applicationBelongsToCompany(applicationID, companyID))) {
            return res.status(404).json({ message: "Application not found" });
        }

        const [[row]] = await database.query(`
            SELECT a.firstName, a.email, j.jobTitle, c.companyName
            FROM applications ap
            INNER JOIN applicants a
                ON ap.applicantID = a.applicantID
            INNER JOIN jobs j
                ON ap.jobID = j.jobID
            INNER JOIN companies c
                ON j.companyID = c.companyID
            WHERE ap.applicationID = ?
            `,
            [applicationID]
        );

        await database.query(`
            UPDATE applications
            SET status = ?
            WHERE applicationID = ?
            `,
            [nextStatus, applicationID]
        );

        res.status(200).json({ message: `Application status updated to ${nextStatus}` });

        if (nextStatus === "shortlisted") {
            await brevo.transactionalEmails.sendTransacEmail({
                sender: {
                    name: process.env.BREVO_SENDER_NAME,
                    email: process.env.BREVO_SENDER_EMAIL
                },
                to: [
                    {
                        email: row.email
                    }
                ],
                templateId: 4,
                params: {
                    applicantFirstName: row.firstName,
                    jobTitle: row.jobTitle,
                    companyName: row.companyName
                }
            });

        } else if (nextStatus === "interview") {
            await brevo.transactionalEmails.sendTransacEmail({
                sender: {
                    name: process.env.BREVO_SENDER_NAME,
                    email: process.env.BREVO_SENDER_EMAIL
                },
                to: [
                    {
                        email: row.email
                    }
                ],
                templateId: 6,
                params: {
                    applicantFirstName: row.firstName,
                    jobTitle: row.jobTitle,
                    companyName: row.companyName
                }
            });   

        } else if (nextStatus === "hired") {
            await brevo.transactionalEmails.sendTransacEmail({
                sender: {
                    name: process.env.BREVO_SENDER_NAME,
                    email: process.env.BREVO_SENDER_EMAIL
                },
                to: [
                    {
                        email: row.email
                    }
                ],
                templateId: 7,
                params: {
                    applicantFirstName: row.firstName,
                    jobTitle: row.jobTitle,
                    companyName: row.companyName
                }
            });
        }

        // return res.status(200).json({ message: `Application status updated to ${nextStatus}` });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Updating application status failed" });
    }
}


export async function rejectApplicant(req, res) {
    const { applicationID } = req.body;
    const { companyID } = req.user;

    try {
        if (!(await applicationBelongsToCompany(applicationID, companyID))) {
            return res.status(404).json({ message: "Application not found" });
        }

        const [[row]] = await database.query(`
            SELECT a.firstName, a.email, j.jobTitle, c.companyName
            FROM applications ap
            INNER JOIN applicants a
                ON ap.applicantID = a.applicantID
            INNER JOIN jobs j
                ON ap.jobID = j.jobID
            INNER JOIN companies c
                ON j.companyID = c.companyID
            WHERE ap.applicationID = ?
            `,
            [applicationID]
        );

        await database.query(`
            UPDATE applications
            SET status = 'not selected'
            WHERE applicationID = ?
            `,
            [applicationID]
        );

        res.status(200).json({ message: "Job application rejected successfully" });

        await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                name: process.env.BREVO_SENDER_NAME,
                email: process.env.BREVO_SENDER_EMAIL
            },
            to: [
                {
                    email: row.email
                }
            ],
            templateId: 5,
            params: {
                applicantFirstName: row.firstName,
                jobTitle: row.jobTitle,
                companyName: row.companyName
            }
        });

        // return res.status(200).json({ message: "Job application rejected successfully" });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Rejecting job application failed" });
    }
}

export async function rejectAllApplicants(req, res) {
    const { jobID, currentStatus } = req.body;
    const { companyID } = req.user;

    try {
        const [applicants] = await database.query(`
            SELECT ap.applicationID, a.firstName, a.email, j.jobTitle, c.companyName
            FROM applications ap
            INNER JOIN applicants a
                ON ap.applicantID = a.applicantID
            INNER JOIN jobs j
                ON ap.jobID = j.jobID
            INNER JOIN companies c
                ON j.companyID = c.companyID
            WHERE ap.jobID = ?
                AND ap.status = ?
                AND j.companyID = ? 
            `,
            [jobID, currentStatus, companyID]
        );

        if (applicants.length === 0) {
            return res.status(200).json({ message: "No applicants to reject" });
        }

        await database.query(`
            UPDATE applications ap
            INNER JOIN jobs j ON ap.jobID = j.jobID
            SET ap.status = 'not selected'
            WHERE ap.jobID = ?
              AND ap.status = ?
              AND j.companyID = ?
        `, [jobID, currentStatus, companyID]);


        res.status(200).json({ message: "All job applications rejected successfully" });

        sendRejectionEmails(applicants, jobID).catch(error => {
            console.error(`Unexpected error sending rejection emails for job ${jobID}`, error);
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Rejecting all job applications failed" });
    }
}

async function sendRejectionEmails(applicants, jobID) {
    const emailResults = await Promise.allSettled(
        applicants.map(row =>
            brevo.transactionalEmails.sendTransacEmail({
                sender: {
                    name: process.env.BREVO_SENDER_NAME,
                    email: process.env.BREVO_SENDER_EMAIL
                },
                to: [{ email: row.email }],
                templateId: 5,
                params: {
                    applicantFirstName: row.firstName,
                    jobTitle: row.jobTitle,
                    companyName: row.companyName
                }
            })
        )
    );

    const failed = emailResults.filter(r => r.status === "rejected");
    if (failed.length > 0) {
        console.error(`${failed.length}/${applicants.length} rejection emails failed for job ${jobID}`, failed);
    }
}

