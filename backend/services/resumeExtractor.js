import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { openai, resumeExtractionPrompt, resumeExtractionSchema } from "../configs/openai.js";
import database from "../configs/database.js";
import crypto from "crypto"
import cleanEvidence from "../utils/cleanEvidence.js"

export function generateFileHash(buffer) {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
}

export async function extractResumeSkills(file) {

    try {
        let resumeText;
    
        if (file.mimetype === "application/pdf") {
            const parser = new PDFParse({
                data: file.buffer
            });
    
            resumeText = (await parser.getText()).text
    
        } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const result = await mammoth.extractRawText({
                buffer: file.buffer
            });
    
            resumeText = result.value;
    
        } else {
            throw new Error("Unsupported file type");
        }
    
        const response = await openai.responses.create({
            model: "gpt-5.4-mini",
            reasoning: {
                effort: "low"
            },
            text: {
                verbosity: "low",
                format: {
                    type: "json_schema",
                    "name": "job_skill_extraction",
                    "strict": true,
                    "schema": resumeExtractionSchema
                }
            },
            input: [
                {
                    role: "system",
                    content: resumeExtractionPrompt
                },
                {
                    role: "user",
                    content: `
                        Extract all skills from the following resume:
                        ${resumeText}
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

export async function generateSkillsEmbeddings(extractedSkills) {
    try {
        const allSkills = [
            ...extractedSkills.skills
        ];

        if (allSkills.length === 0) {
            return {
                skills: []
            };
        }

        // Clean evidence once, up front, and keep it attached to each item
        const cleanedSkills = allSkills.map(item => ({
            ...item,
            evidence: cleanEvidence(item.evidence)
        }));

        const embeddingInputs = [];

        for (const item of cleanedSkills) {
            embeddingInputs.push(item.skill);
            embeddingInputs.push(item.evidence);
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
                evidence: item.evidence, // now guaranteed to be the cleaned version
                skillEmbedding: embeddingResponse.data[index++].embedding,
                evidenceEmbedding: embeddingResponse.data[index++].embedding
            }

            return result;
        }

        return {
            skills: cleanedSkills.map(attachEmbeddings)
        };

    } catch (error) {
        console.error("Generating skill embeddings failed:", error);
        throw error;
    }
}

async function saveResumeSkillEmbeddings(resumeID, resumeSkillsEmbeddings) {
    try {
        const rows = [];
    
        for (const item of resumeSkillsEmbeddings.skills) {
            rows.push({
                resumeID,
                skill: item.skill,
                evidence: item.evidence,
                skillEmbedding: item.skillEmbedding,
                evidenceEmbedding: item.evidenceEmbedding
            });
        }
    
    
        for (const row of rows) {
            await database.query(`
                INSERT INTO resumeSkillsEmbeddings (
                    resumeID,
                    skillName,
                    evidence,
                    skillEmbedding,
                    evidenceEmbedding
                )
                VALUES (?, ?, ?, ?, ?)
            `,
            [
                row.resumeID,
                row.skill,
                row.evidence,
                JSON.stringify(row.skillEmbedding),
                JSON.stringify(row.evidenceEmbedding)
            ]);
        }

    } catch (error) {
        console.error("Saving resume skill embedding failed: ", error);
        throw error;
    }

}

function concatenateResumeSkills(extractedSkills) {
    const allSkills = [
        ...extractedSkills.skills
    ];

    if (allSkills.length === 0) {
        return "";
    }

    let combinedSkills = [];

    for (const item of allSkills) {
        combinedSkills.push(item.skill);
    }

    combinedSkills = combinedSkills.join(", ");
    return combinedSkills;
}

async function generateConcatSkillsEmbedding(concatResumeSkills) {
    try {
        if (!concatResumeSkills || concatResumeSkills.trim() === "") {
            return null;
        }

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: concatResumeSkills,
            dimensions: 1024
        });

        return embeddingResponse.data[0].embedding;

    } catch (error) {
        console.error("Generating concatenated resume skills embedding failed:", error);
        throw error;
    }
}

export async function processResume(file, resumeID) {
    try {
        const extractedSkills = await extractResumeSkills(file);
        const resumeSkillsEmbeddings = await generateSkillsEmbeddings(extractedSkills);
        const concatResumeSkills = concatenateResumeSkills(extractedSkills);
        const concatResumeSkillsEmbedding = await generateConcatSkillsEmbedding(concatResumeSkills);
        
        await database.query(`
            UPDATE resumes
            SET
                extractedResumeSkills = ?,
                concatResumeSkills = ?,
                concatResumeSkillsEmbedding = ?,
                resumeStatus = 'active'
            WHERE resumeID = ?`,
            [
                JSON.stringify(extractedSkills),
                concatResumeSkills,
                JSON.stringify(concatResumeSkillsEmbedding),
                resumeID
            ]
        );

        await saveResumeSkillEmbeddings(resumeID, resumeSkillsEmbeddings);

    } catch (error) {
        console.error("Processing uploaded resume failed: ", error);
        throw error;
    }


}