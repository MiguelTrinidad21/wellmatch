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
    const { page = 1, limit = 5 } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);

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
                pagination: {
                    totalJobs: 0,
                    totalPages: 0,
                    currentPage,
                    limit: pageLimit
                },
                message: "No resume uploaded yet."
            });
        }

        const resume = resumeRows[0];

        if (resume.resumeStatus === "processing") {
            return res.status(200).json({
                resumeStatus: "processing",
                recommendedJobs: [],
                pagination: {
                    totalJobs: 0,
                    totalPages: 0,
                    currentPage,
                    limit: pageLimit
                },
                message: "Your resume is still being analyzed."
            });
        }

        if (resume.resumeStatus === "failed") {
            return res.status(200).json({
                resumeStatus: "failed",
                recommendedJobs: [],
                pagination: {
                    totalJobs: 0,
                    totalPages: 0,
                    currentPage,
                    limit: pageLimit
                },
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

        const sortedRecommendedJobs = jobRows
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
        
        const totalJobs = sortedRecommendedJobs.length;
        const totalPages = Math.ceil(totalJobs / pageLimit);

        const startIndex = (currentPage - 1) * pageLimit;
        const endIndex = startIndex + pageLimit;

        const paginatedJobs = sortedRecommendedJobs.slice(startIndex, endIndex);

        return res.status(200).json({
            resumeStatus: "active",
            sortedRecommendedJobs: paginatedJobs,
            pagination: {
                totalJobs,
                totalPages,
                currentPage,
                limit: pageLimit
            }
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
        const {
            jobTitle = "",
            location = "",
            page = 1,
            limit = 5
        } = req.query;

        const trimmedJobTitle = jobTitle.trim();
        const trimmedLocation = location.trim();

        const currentPage = Math.max(Number(page) || 1, 1);
        const pageLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);

        if (!trimmedJobTitle) {
            return res.status(400).json({
                message: "Job title is required"
            });
        }

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: trimmedJobTitle,
            dimensions: 1024
        });

        const jobTitleEmbedding = embeddingResponse.data[0].embedding;

        let allJobs;

        if (trimmedLocation) {
            const cityOrRegion = trimmedLocation
                .toLowerCase()
                .split(",")[0]
                .trim();

            [allJobs] = await database.query(
                `
                SELECT 
                    j.*, 
                    c.companyName, 
                    c.profilePhotoURL, 
                    c.coverPhotoURL
                FROM jobs j
                INNER JOIN companies c
                    ON j.companyID = c.companyID
                WHERE j.status = 'open'
                    AND LOWER(j.location) LIKE ?
                    AND j.jobSearchEmbedding IS NOT NULL
                `,
                [`%${cityOrRegion}%`]
            );
        } else {
            [allJobs] = await database.query(
                `
                SELECT 
                    j.*, 
                    c.companyName, 
                    c.profilePhotoURL, 
                    c.coverPhotoURL
                FROM jobs j
                INNER JOIN companies c
                    ON j.companyID = c.companyID
                WHERE j.status = 'open'
                    AND j.jobSearchEmbedding IS NOT NULL
                `
            );
        }

        if (allJobs.length === 0) {
            return res.status(200).json({
                relatedJobs: [],
                pagination: {
                    totalJobs: 0,
                    totalPages: 0,
                    currentPage,
                    limit: pageLimit
                }
            });
        }

        const sortedRelatedJobs = allJobs
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
            .filter((job) => job.matchPercentage >= 25)
            .sort((a, b) => b.similarityScore - a.similarityScore);

        const totalJobs = sortedRelatedJobs.length;
        const totalPages = Math.ceil(totalJobs / pageLimit);

        const startIndex = (currentPage - 1) * pageLimit;
        const endIndex = startIndex + pageLimit;

        const paginatedJobs = sortedRelatedJobs.slice(startIndex, endIndex);

        return res.status(200).json({
            relatedJobs: paginatedJobs,
            pagination: {
                totalJobs,
                totalPages,
                currentPage,
                limit: pageLimit
            }
        });

    } catch (error) {
        console.error("Getting related jobs failed:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function getSpecificJob(req, res) {
    const { jobID } = req.params;

    try {
        const [[specificJob]] = await database.query(`
            SELECT 
                j.*,
                c.companyID,
                c.companyName,
                c.profilePhotoURL,
                c.coverPhotoURL
            FROM jobs j
            INNER JOIN companies c
            ON j.companyID = c.companyID
            WHERE j.jobID = ?
            LIMIT 1
            `,
            [jobID]
        );

        return res.status(200).json(specificJob);

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Fetching job failed"})
    }
}

export async function saveJob(req, res) {
    const { id } = req.user;
    const {jobID} = req.body;
    console.log(jobID)

    try {
        const [rows] = await database.query(`
            SELECT *
            FROM savedJobs
            WHERE applicantID = ?
            AND jobID = ?
            LIMIT 1
            `,
            [id, jobID]
        )

        if (rows.length > 0) {
            return res.status(409).json({ message: "Job post is already saved" });
        }

        await database.query(`
            INSERT INTO savedJobs (
                applicantID,
                jobID,
                savedAt
            )
            VALUES (?, ?, NOW())
            `,
            [id, jobID]
        )

        return res.status(201).json({ message: "Job post has saved successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Saving job post failed;" })
    }
}

export async function unsaveJob(req, res) {
    const { id } = req.user;
    const { jobID } = req.query;

    try {

        await database.query(`
            DELETE FROM savedJobs
            WHERE applicantID = ?
            AND jobID = ?
            `,
            [id, jobID]
        )

        return res.status(200).json({ message: "Job post unsaved" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unsaving job post failed;" })
    }    
}

export async function getAllSavedJobs(req, res) {
    const { id } = req.user;

    try {

        const [fullData] = await database.query(`
            SELECT
                s.*,
                j.jobID,
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
                c.companyName,
                c.profilePhotoURL
            FROM savedJobs s
            INNER JOIN jobs j
                ON s.jobID = j.jobID
            INNER JOIN companies c
                ON j.companyID = c.companyID
            WHERE s.applicantID = ?
            `,
            [id]
        )

        const jobIDList = fullData.map(row => row.jobID);

        return res.status(200).json({ 
            savedJobs: fullData,
            jobIDs: jobIDList
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Fetching saved job post failed;" })
    }   
}