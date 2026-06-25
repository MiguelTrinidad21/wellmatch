import database from "../configs/database.js";
import { buildJobSkillGroups, buildResumeSkillGroups } from "../utils/skillGroups.js";
import { compareJobSkillsToResume } from "../utils/compareJobSkillsToResume.js";
import { getMatchedSkills, getSkillGaps } from "../utils/separateMatchedAndMissing.js";
import calculateSkillScores from "../utils/calculateSkillScores.js";

export async function skillGapService(resumeID, jobID) {
    try {
        const [resumeSkills] = await database.query(`
            SELECT *
            FROM resumeSkillsEmbeddings
            WHERE resumeID = ?
            `,
            [resumeID]
        );

        const [jobSkills] = await database.query(`
            SELECT *
            FROM jobSkillEmbeddings
            WHERE jobID = ?
            `,
            [jobID]
        );

        if (resumeSkills.length === 0) {
            throw new Error("Could not find extracted skills from the resume file.");
        }
        

        if (jobSkills.length === 0) {
            throw new Error("Could not find extracted skills from this job.");
        }
        
        // Group Required and ANY_OF skills
        const jobSkillGroups = buildJobSkillGroups(jobSkills);
        const resumeSkillGroups = buildResumeSkillGroups(resumeSkills);
        
        // Get all status of job skill if they are missing or matched
        const skillGapResult = compareJobSkillsToResume(jobSkillGroups, resumeSkillGroups);

        // Separate matched and missing skills
        const matchedSkills = getMatchedSkills(skillGapResult);
        const missingSkills = getSkillGaps(skillGapResult);

        // Calculate match scores
        const scoreBreakdown = calculateSkillScores(matchedSkills, skillGapResult);

        return {
            matchedSkills,
            missingSkills,
            scoreBreakdown
        }

    } catch (error) {
        console.error(error);
        throw error;
    }
}