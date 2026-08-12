import database from "../../configs/database.js";
import brevo from "../../configs/brevo.js";
import "dotenv/config";
import formatDate from "../../utils/formatDate.js";

export async function submitApplication(req, res) {
    const { id } = req.user;
    const { resumeID, yearsExp, jobTitle, companyName } = req.body
    const { jobID } = req.params

    const activeStatus = [
        "submitted",
        "shortlisted",
        "interview",
        "hired"
    ];

    try {
        const [applicantRows] = await database.query(`
            SELECT firstName, email
            FROM applicants
            WHERE applicantID = ?
            LIMIT 1
            `,
            [id]
        );

        if (applicantRows.length === 0) {
            return res.status(404).json({ message: "Applicant account not found" });
        }

        const { firstName, email } = applicantRows[0];
                
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
    const offset = (currentPage - 1) * pageLimit;

    try {
        // 1. Get total count matching the filters (no JOIN needed here since
        // status/applicantID live on `applications` itself)
        const [countRows] = await database.query(`
            SELECT COUNT(*) AS total
            FROM applications a
            WHERE a.applicantID = ?
            AND a.status = ?
        `, [id, status]);

        const totalApplications = countRows[0].total;
        const totalPages = Math.ceil(totalApplications / pageLimit);

        if (totalApplications === 0) {
            return res.status(200).json({
                applications: [],
                pagination: {
                    totalApplications: 0,
                    totalPages: 0,
                    currentPage,
                    limit: pageLimit
                }
            });
        }

        // 2. Fetch only the rows needed for this page
        const [rows] = await database.query(`
            SELECT
                a.*,
                j.jobTitle,
                j.jobOverview,
                j.jobDuties,
                j.requiredQualifications,
                j.preferredQualifications,
                j.workingConditions,
                j.jobBenefits,
                j.location,
                j.workPlaceOption,
                j.workType,
                j.minSalary,
                j.maxSalary,
                j.concatJobSkills,
                c.companyName,
                c.profilePhotoURL,
                s.overallScore,
                s.scoresBreakdown
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
            ORDER BY a.applicationDate DESC
            LIMIT ? OFFSET ?
        `, [id, status, pageLimit, offset]);

        return res.status(200).json({
            applications: rows,
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
