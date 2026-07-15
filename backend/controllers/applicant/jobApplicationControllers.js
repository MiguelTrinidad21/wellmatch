import database from "../../configs/database.js";
import brevo from "../../configs/brevo.js";
import "dotenv/config";
import formatDate from "../../utils/formatDate.js";

export async function submitApplication(req, res) {
    const { id, firstName, email } = req.user;
    const { resumeID, yearsExp, jobTitle, companyName } = req.body
    const { jobID } = req.params

    const activeStatus = [
        "submitted",
        "shortlisted",
        "interview",
        "hired"
    ];

    try {
        const [rows] = await database.query(`
            SELECT status
            FROM applications
            WHERE applicantID = ?
                AND jobID = ?
            ORDER BY applicationDate DESC
            LIMIT 1;
            `,
            [id, jobID]
        );

        if ((rows.length > 0) && (activeStatus.includes(rows[0].status))) {
            return res.status(409).json({ message: "You still have an active application for this job post" })
        }

        await database.query(`
            INSERT INTO applications (
                applicantID,
                jobID,
                resumeID,
                yearsExp,
                status,
                applicationDate
            )
            VALUES (?,?,?,?, 'submitted', NOW())
            `,
            [
                id, 
                jobID,
                resumeID,
                yearsExp,
            ]
        );

        const [date] = await database.query(`
            SELECT applicationDate
            FROM applications
            WHERE applicantID = ?
            ORDER BY applicationDate DESC
            `, 
            [id]
        );

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
            templateId: 3,
            params: {
                applicantFirstName: firstName,
                jobTitle,
                companyName,
                applicationDate: formatDate(date[0].applicationDate)
            }
        });

        return res.status(201).json({ message: "Job application submitted successfully." })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Submitting application failed." })
    }
}

export async function fetchApplications(req, res) {
    const { id } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);  

    try {
        const [rows] = await database.query(`
            SELECT
                a.*,
                j.jobTitle,
                j.location,
                j.workType,
                c.companyName,
                s.overallScore
            FROM applications a
            INNER JOIN jobs j
                ON a.jobID = j.jobID
            INNER JOIN companies c
                ON j.companyID = c.companyID
            LEFT JOIN skillGapAnalysis s
                ON s.resumeID = a.resumeID
                AND s.jobID = a.jobID
            WHERE a.applicantID = ?
            AND a.status = ?
        `, [id, status]);

        if (rows.length === 0) {
            return res.status(200).json({
                applications: rows,
                pagination: {
                    totalApplications: 0,
                    totalPages: 0,
                    currentPage,
                    limit: pageLimit                   
                }
            });
        }

        const totalApplications = rows.length;
        const totalPages = Math.ceil(totalApplications / pageLimit);

        const startIndex = (currentPage - 1) * pageLimit;
        const endIndex = startIndex + pageLimit;

        const paginatedApplications = rows.slice(startIndex, endIndex);

        return res.status(200).json({
            applications: paginatedApplications,
            pagination: {
                totalApplications,
                totalPages,
                currentPage,
                limit: pageLimit
            }
        });   

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fetching job applications failed" });
    }
}

export async function withdrawApplication(req, res) {
    const { id } = req.user;
    const { applicationID } = req.params;

    try {
        await database.query(`
            UPDATE applications
            SET status = 'withdraw'
            WHERE applicationID = ?
        `, [applicationID]);

        return res.status(200).json({ message: "Successfully withdrew application" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Faile to withdraw job application" });
    }
}
