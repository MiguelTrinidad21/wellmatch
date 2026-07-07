import database from "../../configs/database.js";
import { skillGapService } from "../../services/skillGapService.js";
import { generateExplanation, generateUpskillingRecos } from "../../services/skillGapAIService.js";

function formatReport(report) {
    return {
        analysisID: report.analysisID,
        jobID: report.jobID,
        matchedSkills: JSON.parse(report.matchedSkills),
        missingSkills: JSON.parse(report.missingSkills),
        overallScore: report.overallScore,
        resumeID: report.resumeID,
        scoreExplanation: report.scoreExplanation,
        scoresBreakdown: JSON.parse(report.scoresBreakdown),
        firstName: report.firstName,
        lastName: report.lastName,
        email: report.email,
        address: report.address,
        profilePhotoURL: report.profilePhotoURL
    };
}

export async function getJobInfo(req, res) {
    const { jobID } = req.query;

    try {
        const [[jobInfo]] = await database.query(`
            SELECT
                jobTitle,
                requiredQualifications,
                preferredQualifications
            FROM jobs
            WHERE jobID = ?
            LIMIT 1
            `,
            [jobID]
        );

        return res.status(200).json(jobInfo)
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fetching job info failed" })
    }
}

export async function getSkillGapReport(req, res) {
    const { jobID, resumeID } = req.query;

    if (!resumeID || !jobID) {
        return res.status(400).json({
            message: "resumeID and jobID are required."
        });
    }

    try {

        const [existingReport] = await database.query(
            `
            SELECT 
                s.*, 
                a.firstName, 
                a.lastName,
                a.email, 
                a.address, 
                a.profilePhotoURL
            FROM skillGapAnalysis s
            JOIN resumes r
                ON s.resumeID = r.resumeID
            JOIN applicants a
                ON r.applicantID = a.applicantID
            WHERE s.resumeID = ?
            AND s.jobID = ?
            LIMIT 1
            `,
            [resumeID, jobID]
        );

        if (existingReport.length > 0) {
            return res.status(200).json({
                message: "Existing skill gap report detected",
                skillGapReport: formatReport(existingReport[0])
            });
        }

        const skillGapResult = await skillGapService(resumeID, jobID);

        const matchScoreExplanation = await generateExplanation(
            jobID,
            skillGapResult
        );

        const upskillingRecommendations = await generateUpskillingRecos(
            jobID,
            skillGapResult.missingSkills
        );

        await database.query(
            `
            INSERT IGNORE INTO skillGapAnalysis (
                resumeID,
                jobID,
                overallScore,
                scoresBreakdown,
                matchedSkills,
                missingSkills,
                scoreExplanation,
                upskillingReco
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                resumeID,
                jobID,
                skillGapResult.scoreBreakdown.overAllScore,
                JSON.stringify(skillGapResult.scoreBreakdown),
                JSON.stringify(skillGapResult.matchedSkills),
                JSON.stringify(skillGapResult.missingSkills),
                matchScoreExplanation,
                upskillingRecommendations
            ]
        );        

        const [finalReport] = await database.query(`
            SELECT 
                s.*, 
                a.firstName, 
                a.lastName,
                a.email, 
                a.address, 
                a.profilePhotoURL
            FROM skillGapAnalysis s
            JOIN resumes r
                ON s.resumeID = r.resumeID
            JOIN applicants a
                ON r.applicantID = a.applicantID
            WHERE s.resumeID = ?
            AND s.jobID = ?
            LIMIT 1
            `,
            [resumeID, jobID]
        );

        return res.status(200).json({
            message: "New skill gap report ready",
            skillGapReport: formatReport(finalReport[0])
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fetching skill gap report failed" })
    }
}

export async function getCandidateHistory(req, res) {
    const { applicantID } = req.query;

    try {
        const [workExp] = await database.query(`
            SELECT *
            FROM workExperiences
            WHERE applicantID = ?
            AND status = 'active'
            `,
            [applicantID]
        );

        const [credentials] = await database.query(`
            SELECT *
            FROM credentials
            WHERE applicantID = ?
            AND status = 'active'
            `,
            [applicantID]
        );

        const [education] = await database.query(`
            SELECT *
            FROM education
            WHERE applicantID = ?
            AND status = 'active'
            `,
            [applicantID]
        );

        return res.status(200).json({
            workExp,
            credentials,
            education
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fetching candidate history failed" })
    }
}

