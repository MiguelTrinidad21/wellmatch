import { openai, skillExtractionPrompt, jobSkillExtractionSchema } from "../configs/openai.js";
import database from "../configs/database.js";
import { JSDOM } from "jsdom";


function htmlToText(html) {
    return new JSDOM(html).window.document.body.textContent || "";
}

export function normalizeQuillContent(html) {
    if (!html) {
        return null;
    }

    const text =
        new JSDOM(html).window.document.body.textContent?.trim() || "";

    if (!text) {
        return null;
    }

    return html.trim();
}

function addPunctuation(html) {
    if (!html) {
        return null;
    }

    const document = new JSDOM(html).window.document;
    const lines = [];

    document.body.querySelectorAll("p, li").forEach((element) => {
        let text = element.textContent?.trim() || "";

        if (!text) {
            return;
        }

        if (!/[.!?:;)]$/.test(text)) {
            text += ".";
        }

        // lines.push(`• ${text}`);
        lines.push(text);
    });

    const normalizedText = lines.join("\n").trim();

    if (!normalizedText) {
        return null;
    }

    return normalizedText;
}

async function extractSkills(jobID) {
    try {
        const [requirements] = await database.query(`
            SELECT jobID, requiredQualifications, preferredQualifications
            FROM jobs
            WHERE jobID = ?
            LIMIT 1`,
            [jobID]
        );

        if (requirements.length === 0) {
            throw new Error("Job not found");
        }

        const cleanedRequiredSkills = addPunctuation(requirements[0].requiredQualifications);
        const cleanedPreferredSkills = addPunctuation(requirements[0].preferredQualifications);

        const required = cleanedRequiredSkills
            ? cleanedRequiredSkills
            : "";

        const preferred = cleanedPreferredSkills
            ? cleanedPreferredSkills
            : "";

        const response = await openai.responses.create({
            model: "gpt-5.4-mini",
            reasoning: {
                effort: "medium"
            },
            text: {
                verbosity: "low",
                format: {
                    type: "json_schema",
                    "name": "job_skill_extraction",
                    "strict": true,
                    "schema": jobSkillExtractionSchema
                }
            },
            input: [
                {
                    role: "system",
                    content: skillExtractionPrompt
                },
                {
                    role: "user",
                    content: `
                        If preferred qualifications are empty or not provided, extract skills only from required qualifications.
                        
                        Required Qualifications: 
                        ${required}

                        Preferred Qualifications:
                        ${preferred}
                    `
                }
            ]
        });

        return JSON.parse(response.output_text);

    } catch (error) {
        console.error(error);
        throw error;
    }

}

async function generateSkillsEmbeddings(extractedSkills) {
    try {
        const allSkills = [
            ...extractedSkills.coreSkills,
            ...extractedSkills.secondarySkills
        ];

        if (allSkills.length === 0) {
            return {
                coreSkills: [],
                secondarySkills: []
            };
        }

        const embeddingInputs = [];

        for (const item of allSkills) {
            for (const eachSkill of item.acceptableSkills) {
                embeddingInputs.push(eachSkill);
                embeddingInputs.push(`${eachSkill}: ${item.evidence}`);
            }
        }

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: embeddingInputs,
            dimensions: 1024
        });

        let index = 0;

        function attachEmbeddings(item) {
            const result = {
                skill: item.skill,
                matchRule: item.matchRule,
                evidence: item.evidence,
                acceptableSkills: item.acceptableSkills.map((acceptableSkill) => {
                    return {
                        skill: acceptableSkill,
                        skillEmbedding: embeddingResponse.data[index++].embedding,
                        evidenceEmbedding: embeddingResponse.data[index++].embedding
                    };
                })
            }

            return result;
        }

        return {
            coreSkills: extractedSkills.coreSkills.map(attachEmbeddings),
            secondarySkills: extractedSkills.secondarySkills.map(attachEmbeddings)
        };

    } catch (error) {
        console.error("Generating skill embeddings failed:", error);
        throw error;
    }    
}

async function saveJobSkillEmbeddings(jobID, jobSkillsEmbeddings) {
    try {
        const rows = [];
    
        for (const item of jobSkillsEmbeddings.coreSkills) {
            for (const acceptableSkill of item.acceptableSkills) {
                rows.push({
                    jobID,
                    skillType: "core",
                    parentSkill: item.skill,
                    matchRule: item.matchRule,
                    acceptableSkill: acceptableSkill.skill,
                    evidence: item.evidence,
                    skillEmbedding: acceptableSkill.skillEmbedding,
                    evidenceEmbedding: acceptableSkill.evidenceEmbedding
                });
            }
        }
    
        for (const item of jobSkillsEmbeddings.secondarySkills) {
            for (const acceptableSkill of item.acceptableSkills) {
                rows.push({
                    jobID,
                    skillType: "secondary",
                    parentSkill: item.skill,
                    matchRule: item.matchRule,
                    acceptableSkill: acceptableSkill.skill,
                    evidence: item.evidence,
                    skillEmbedding: acceptableSkill.skillEmbedding,
                    evidenceEmbedding: acceptableSkill.evidenceEmbedding
                });
            }
        }
    
        for (const row of rows) {
            await database.query(`
                INSERT INTO jobSkillEmbeddings (
                    jobID,
                    skillType,
                    parentSkill,
                    matchRule,
                    acceptableSkill,
                    evidence,
                    skillEmbedding,
                    evidenceEmbedding
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                row.jobID,
                row.skillType,
                row.parentSkill,
                row.matchRule,
                row.acceptableSkill,
                row.evidence,
                JSON.stringify(row.skillEmbedding),
                JSON.stringify(row.evidenceEmbedding)
            ]);
        }
        
    } catch (error) {
        console.error("Saving job skill embedding failed:", error);
        throw error;
    }
}

function concatenateJobSkills(extractedSkills) {
    const allSkills = [
        ...extractedSkills.coreSkills,
        ...extractedSkills.secondarySkills
    ];

    if (allSkills.length === 0) {
        return "";
    }

    let combinedSkills = [];

    for (const item of allSkills) {
        for (const eachSkill of item.acceptableSkills) {
            combinedSkills.push(eachSkill);
        }
    }

    combinedSkills = combinedSkills.join(", ");
    return combinedSkills;
}

async function generateConcatSkillsEmbedding(concatJobSkills) {
    try {
        if (!concatJobSkills || concatJobSkills.trim() === "") {
            return null;
        }

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: concatJobSkills,
            dimensions: 1024
        });

        return embeddingResponse.data[0].embedding;

    } catch (error) {
        console.error("Generating concatenated job skills embedding failed:", error);
        throw error;
    }
}

async function createJobSearchText(jobID, concatJobSkills) {
    try {
        const [jobResult] = await database.query(`
            SELECT
                jobTitle,
                jobOverview,
                location,
                workPlaceOption,
                workType
            FROM jobs
            WHERE jobID = ?
            LIMIT 1`,
            [jobID]
        );

        if (jobResult.length === 0) {
            throw new Error("Job info not found");
        }

        const job = jobResult[0];

        const jobSearchText = `
            Job Title: ${job.jobTitle},
            Job Summary: ${job.jobOverview},
            Location: ${job.location},
            Skills: ${concatJobSkills},
            Work Place: ${job.workPlaceOption},
            Work Type: ${job.workType}
        `;

        return jobSearchText;

    } catch (error) {
        console.error(error);
        throw error
    }
}

async function generateJobSearchEmbedding(jobSearchText) {
    try {
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: jobSearchText,
            dimensions: 1024
        });

        return embeddingResponse.data[0].embedding;

    } catch (error) {
        console.error("Generating job search text embedding failed:", error);
        throw error;
    }
}

export async function processJob(jobID) {
    try {
        const extractedJobSkills = await extractSkills(jobID);
        const jobSkillsEmbeddings = await generateSkillsEmbeddings(extractedJobSkills);
        const concatJobSkills = concatenateJobSkills(extractedJobSkills);
        const concatJobSkillsEmbedding = await generateConcatSkillsEmbedding(concatJobSkills);
        const jobSearchText = await createJobSearchText(jobID, concatJobSkills);
        const jobSearchEmbedding = await generateJobSearchEmbedding(jobSearchText);
        
        await database.query(`
            UPDATE jobs
            SET
                extractedJobSkills = ?,
                concatJobSkills = ?,
                concatJobSkillsEmbedding = ?,
                jobSearchText = ?,
                jobSearchEmbedding = ?
            WHERE jobID = ?`,
            [
                JSON.stringify(extractedJobSkills),
                concatJobSkills,
                JSON.stringify(concatJobSkillsEmbedding),
                jobSearchText,
                JSON.stringify(jobSearchEmbedding),
                jobID
            ]
        );

        await saveJobSkillEmbeddings(jobID, jobSkillsEmbeddings);

    } catch (error) {
        console.error("Processing inserted job failed:", error);
        throw error;
    }


}