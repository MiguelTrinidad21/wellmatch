import database from "../configs/database.js";
import { openai, scoreExplanationPrompt, upskillingRecoPrompt } from "../configs/openai.js";

export async function generateExplanation(jobID, skillGapResult) {

    try {
        const [jobSearchText] = await database.query(`
            SELECT jobSearchText
            FROM jobs
            WHERE jobID = ?
            LIMIT 1
            `,
            [jobID]
        );

        if (jobSearchText.length === 0) {
            return res.status(404).json({ message: "jobID not found" })
        }

        const payload = {
            jobOverview: jobSearchText[0].jobSearchText,

            scoreBreakdown: skillGapResult.scoreBreakdown,

            scoringRulesForOverallScore: {
                coreWeight: "80%",
                secondaryWeight: "20%",
                anyOfRule: "For ANY_OF skills, matching one acceptable option satisfies the whole requirement."
            },

            matchedSkills: skillGapResult.matchedSkills.map(skill => ({
                skillType: skill.skillType,
                parentSkill: skill.parentSkill,
                matchRule: skill.matchRule,
                matchedJobSkill: skill.matchedJobSkill
            })),

            missingSkills: skillGapResult.missingSkills.map(skill => ({
                skillType: skill.skillType,
                parentSkill: skill.parentSkill,
                matchRule: skill.matchRule,
                requiredOptions: skill.requiredOptions
            }))
        }

        const response = await openai.responses.create({
            model: "gpt-5.4-mini",
            reasoning: {
                effort: "low"
            },
            text: {
                verbosity: "low"
            },
            input: [
                {
                    role: "system",
                    content: scoreExplanationPrompt
                },
                {
                    role: "user",
                    content: `
                    Generate a match score explanation using this payload:
                    ${JSON.stringify(payload, null, 2)}
                    `
                }
            ]
        });

        return response.output_text;


        
    } catch (error) {
        console.error(error);
        throw error;
    }
}


export async function generateUpskillingRecos(jobID, missingSkills) {

    try {
        const [jobTitle] = await database.query(`
            SELECT jobTitle
            FROM jobs
            WHERE jobID = ?
            LIMIT 1
            `,
            [jobID]
        );

        if (jobTitle.length === 0) {
            throw new Error("Job title for not found");
        }
    
        const payload = {
            jobTitle: jobTitle[0].jobTitle,

            missingSkills: missingSkills.map(skill => ({
                skillGap: skill.parentSkill,

                label: skill.skillType === "core"
                    ? "Priority"
                    : "Secondary",

                skillType: skill.skillType,

                matchRule: skill.matchRule,

                requiredOptions: skill.requiredOptions,

                jobEvidence: skill.jobEvidence
            }))
        };

        const response = await openai.responses.create({
            model: "gpt-5.4-mini",
            reasoning: {
                effort: "low"
            },
            text: {
                verbosity: "low"
            },
            input: [
                {
                    role: "system",
                    content: upskillingRecoPrompt
                },
                {
                    role: "user",
                    content: `
                    Payload:
                    ${JSON.stringify(payload, null, 2)}
                    `
                }
            ]
        });

        return response.output_text;

    } catch (error) {
        console.error(error);
        throw error;
    }
}