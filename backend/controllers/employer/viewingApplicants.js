import database from "../../configs/database.js";


export async function fetchApplicants(req, res) {
    const {
        jobID,
        status,
        page = 1,
        limit = 10
    } = req.query;
    
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);  

    if (jobID === "selectFirst") {
        return res.status(200).json({
            allApplicants: [],
            jobTitle: "",
            pagination: {
                totalApplicants: 0,
                totalPages: 0,
                currentPage,
                limit: pageLimit
            }
        });
    }


    const [[years]] = await database.query(`
        SELECT requiredYearsExp
        FROM jobs
        WHERE jobID = ?
        LIMIT 1
        `,
        [jobID]
    );

    const yearsRequired = years.requiredYearsExp;

    let allApplicants;

    if (status === "not selected") {
        [allApplicants] = await database.query(`
            SELECT a.*, s.overallScore, ap.firstName, ap.lastName
            FROM applications a
            INNER JOIN skillGapAnalysis s
                ON a.jobID = s.jobID
                AND a.resumeID = s.resumeID
            INNER JOIN applicants ap
                ON a.applicantID = ap.applicantID
            WHERE a.jobID = ?
                AND a.status IN ('not selected', 'withdraw')
            ORDER BY
                (a.yearsExp >= ?) DESC,
                s.overallScore DESC
            `,
            [jobID, yearsRequired]
        );

    } else {
        [allApplicants] = await database.query(`
            SELECT a.*, s.overallScore, ap.firstName, ap.lastName
            FROM applications a
            LEFT JOIN skillGapAnalysis s
                ON a.jobID = s.jobID
                AND a.resumeID = s.resumeID
            INNER JOIN applicants ap
                ON a.applicantID = ap.applicantID
            WHERE a.jobID = ?
                AND a.status = ?
            ORDER BY
                (a.yearsExp >= ?) DESC,
                s.overallScore DESC
            `,
            [jobID, status, yearsRequired]
        );
    }

    const [[job]] = await database.query(`
        SELECT jobTitle
        FROM jobs
        WHERE jobID = ?
        `,
        [jobID]
    );
    

    if (allApplicants.length === 0) {
        return res.status(200).json({
            allApplicants,
            jobTitle: job.jobTitle,
            pagination: {
                totalApplicants: 0,
                totalPages: 0,
                currentPage,
                limit: pageLimit
            }
        });
    }    

    const totalApplicants = allApplicants.length;
    const totalPages = Math.ceil(totalApplicants / pageLimit);

    const startIndex = (currentPage - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;

    const paginatedApplicants = allApplicants.slice(startIndex, endIndex);

    return res.status(200).json({
        allApplicants: paginatedApplicants,
        jobTitle: job.jobTitle,
        pagination: {
            totalApplicants,
            totalPages,
            currentPage,
            limit: pageLimit
        }
    });    
}