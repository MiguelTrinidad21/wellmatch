import database from "../../configs/database.js";
import { openai } from "../../configs/openai.js";
import { cosineSimilarity } from "../../utils/cosineSimilarity.js";

function parseEmbedding(embedding) {
    if (!embedding) {
        return null;
    }

    if (Array.isArray(embedding)) {
        return embedding;
    }

    try {
        return JSON.parse(embedding);
    } catch {
        return null;
    }
}


export async function getRecommendedJobs(req, res) {
    const { id } = req.user;

    try {
        const [resumeRows] = await database.query(
            `
            SELECT
                resumeID,
                resumeStatus,
                concatResumeSkillsEmbedding
            FROM resumes
            WHERE applicantID = ?
                AND isDefault = 1
            LIMIT 1
            `,
            [id]
        );

        if (resumeRows.length === 0) {
            return res.status(200).json({
                resumeStatus: "missing",
                recommendedJobs: [],
                message: "No resume uploaded yet."
            });
        }

        const resume = resumeRows[0];

        if (resume.resumeStatus === "processing") {
            return res.status(200).json({
                resumeStatus: "processing",
                recommendedJobs: [],
                message: "Your resume is still being analyzed."
            });
        }

        if (resume.resumeStatus === "failed") {
            return res.status(200).json({
                resumeStatus: "failed",
                recommendedJobs: [],
                message: "Resume processing failed. Please upload your resume again."
            });
        }

        // if (
        //     resume.resumeStatus !== "processed" ||
        //     !resume.concatResumeSkillsEmbedding
        // ) {
        //     return res.status(200).json({
        //         resumeStatus: "notReady",
        //         recommendedJobs: [],
        //         message: "Resume recommendation data is not ready yet."
        //     });
        // }

        const resumeEmbedding = JSON.parse(resume.concatResumeSkillsEmbedding);

        const [jobRows] = await database.query(
            `
            SELECT
                j.jobID,
                j.companyID,
                c.companyName,
                c.profilePhotoURL,
                c.coverPhotoURL,
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
                j.requiredYearsExp,
                j.concatJobSkillsEmbedding
            FROM jobs j
            INNER JOIN companies c
            ON j.companyID = c.companyID
            WHERE j.status = 'open'
                AND j.concatJobSkillsEmbedding IS NOT NULL
            `
        );

        const recommendedJobs = jobRows
            .map((job) => {
                const jobEmbedding = JSON.parse(job.concatJobSkillsEmbedding);

                const similarityScore = cosineSimilarity(
                    resumeEmbedding,
                    jobEmbedding
                );

                return {
                    ...job,
                    similarityScore,
                    matchPercentage: Math.round(similarityScore * 100)
                };
            })
            .sort((a, b) => b.similarityScore - a.similarityScore);

        return res.status(200).json({
            resumeStatus: "active",
            recommendedJobs
        });

    } catch (error) {
        console.error("Getting recommended jobs failed:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function searchJobs(req, res) {
    try {
        const { jobTitle, location } = req.query;

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: jobTitle,
            dimensions: 1024
        });

        const jobTitleEmbedding = embeddingResponse.data[0].embedding;

        let allJobs;

        if (location) {
            const splitLocation = location.trim().toLowerCase().split(", ");

            [allJobs] = await database.query(`
                SELECT j.*, c.companyName, c.profilePhotoURL, c.coverPhotoURL
                FROM jobs j
                INNER JOIN companies c
                ON j.companyID = c.companyID
                WHERE status = 'open'
                AND location LIKE ?
                AND jobSearchEmbedding IS NOT NULL
                `,
                [`${splitLocation[0]}`]
            );

        } else {
            [allJobs] = await database.query(`
                SELECT j.*, c.companyName, c.profilePhotoURL, c.coverPhotoURL
                FROM jobs j
                INNER JOIN companies c
                ON j.companyID = c.companyID
                WHERE status = 'open'
                AND jobSearchEmbedding IS NOT NULL
                `
            );
        }

        if (allJobs.length === 0 ) {
            return res.status(200).json({relatedJobs: []})
        }

        const relatedJobs = allJobs
            .map((job) => {
                const jobEmbedding = JSON.parse(job.jobSearchEmbedding);

                const similarityScore = cosineSimilarity(
                    jobTitleEmbedding,
                    jobEmbedding
                );

                return {
                    ...job,
                    similarityScore,
                    matchPercentage: Math.round(similarityScore * 100)
                };
            })
            .sort((a, b) => b.similarityScore - a.similarityScore);

        return res.status(200).json({
            relatedJobs
        });
        
    } catch (error) {
        console.error("Getting related jobs failed:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }


    
}