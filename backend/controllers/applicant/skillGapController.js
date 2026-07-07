import { skillGapService } from "../../services/skillGapService.js";
import { generateExplanation, generateUpskillingRecos } from "../../services/skillGapAIService.js";
import database from "../../configs/database.js";

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
        upskillingReco: JSON.parse(report.upskillingReco)
    };
}

export async function skillGapController(req, res) {
    const { jobID, resumeID } = req.params;

    if (!resumeID || !jobID) {
        return res.status(400).json({
            message: "resumeID and jobID are required."
        });
    }

    try {
        const [existingReport] = await database.query(
            `
            SELECT *
            FROM skillGapAnalysis
            WHERE jobID = ?
            AND resumeID = ?
            LIMIT 1
            `,
            [jobID, resumeID]
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

        const [finalReport] = await database.query(
            `
            SELECT *
            FROM skillGapAnalysis
            WHERE jobID = ?
            AND resumeID = ?
            LIMIT 1
            `,
            [jobID, resumeID]
        );

        return res.status(200).json({
            message: "New skill gap report ready",
            skillGapReport: formatReport(finalReport[0])
        });

    } catch (error) {
        console.error("Analyze skill gap controller error:", error);

        return res.status(500).json({
            message: error.message || "Failed to generate skill gap analysis."
        });
    }
}