import database from "../../configs/database.js";
import { processJob, normalizeQuillContent } from "../../helpers/extractSkillsAndEmbeddings.js";



export async function postJob(req, res) {
    const compMemID = req.user.compMemID;
    const companyID = req.user.companyID;

    let { 
        jobTitle,
        location, 
        workplaceOption,
        workType,
        payRangeFrom,
        payRangeTo,
        jobOverview,
        jobDuties,
        requiredQualifications,
        preferredQualifications,
        workingConditions,
        jobBenefits,
        yearsRequired        
     } = req.body;

    jobDuties = normalizeQuillContent(jobDuties);
    requiredQualifications = normalizeQuillContent(requiredQualifications);
    preferredQualifications = normalizeQuillContent(preferredQualifications);
    workingConditions= normalizeQuillContent(workingConditions);
    jobBenefits = normalizeQuillContent(jobBenefits);

    const minSalary = payRangeFrom ? Number(payRangeFrom) : null;
    const maxSalary = payRangeTo ? Number(payRangeTo) : null;

    if (minSalary !== null && maxSalary !== null && minSalary > maxSalary) {
        return res.status(400).json({
            message: "Minimum salary cannot be greater than maximum salary"
        });
    }

    try {
        const [newJob] =  await database.query(`
            INSERT INTO jobs (
                createdByCompMemID,
                companyID,
                jobTitle,
                jobOverview,
                jobDuties,
                requiredQualifications,
                preferredQualifications,
                workingConditions,
                jobBenefits,
                location,
                workPlaceOption,
                workType,
                minSalary,
                maxSalary,
                status,
                createdAt,
                requiredYearsExp
            )
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'open', NOW(), ?)`,
            [
                compMemID,
                companyID,
                jobTitle,
                jobOverview,
                jobDuties,
                requiredQualifications,
                preferredQualifications,
                workingConditions,
                jobBenefits,
                location,
                workplaceOption,
                workType,
                minSalary,
                maxSalary,
                yearsRequired
            ]
        );

        processJob(newJob.insertId).catch((error) => {
            console.error("Job processing failed:", error);
        });

        return res.status(201).json({message: "job posted successfully"});

    } catch (error) {
        console.error(error)
        return res.status(500).json({message: "Internal server error occurred while fetching job info"});
    }

}


export async function getJobs(req, res) {
    const { companyID } = req.user;
    const { jobStatus } = req.query;

    try {
        const [fetchedJobs] = await database.query(`
            SELECT
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
                j.createdAt,
                j.updatedAt,
                comp.profilePhotoURL,
                comp.coverPhotoURL,

                creator.firstName AS createdByFirstName,
                creator.lastName AS createdByLastName,

                updater.firstName AS updatedByFirstName,
                updater.lastName AS updatedByLastName

            FROM jobs j

            INNER JOIN companies comp
                ON j.companyID = comp.companyID

            INNER JOIN companyMembers cmCreator
                ON j.createdByCompMemID = cmCreator.compMemID

            INNER JOIN employers creator
                ON cmCreator.employerID = creator.employerID

            LEFT JOIN companyMembers cmUpdater
                ON j.updatedByCompMemID = cmUpdater.compMemID

            LEFT JOIN employers updater
                ON cmUpdater.employerID = updater.employerID

            WHERE j.companyID = ?
            AND j.status = ?
            ORDER BY j.updatedAt DESC
            `,
            [companyID, jobStatus]
        );

        const [totalApplicants] = await database.query(`
            SELECT *
            FROM applications`
        );

        return res.status(200).json({ fetchedJobs, totalApplicants });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error occurred while inserting job"
        });
    }
}

export async function getSpecificJob(req, res) {
    const { jobID } = req.params;
    const { companyID } = req.user;

    try {
        const [jobToEdit] = await database.query(`
            SELECT j.*, c.companyName 
            FROM jobs j
            INNER JOIN companies c
            ON j.companyID = c.companyID
            WHERE j.jobID = ?
            AND j.companyID = ?
            LIMIT 1
            `,
            [jobID, companyID]
        );

        if (jobToEdit.length === 0) {
            return res.status(404).json({message: "Job not found"});
        }

        return res.status(200).json({ jobToEdit: jobToEdit[0] });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error occurred" });
    }
} 

export async function updateJobInfo(req, res) {
    const { companyID, compMemID } = req.user;
    const { jobID } = req.params;
    
    let {
        jobTitle,
        location,
        workplaceOption,
        workType,
        payRangeFrom,
        payRangeTo,
        jobOverview,
        jobDuties,
        requiredQualifications,
        preferredQualifications,
        workingConditions,
        jobBenefits,
        yearsRequired
    } = req.body;

    let connection;

    try {
        jobDuties = normalizeQuillContent(jobDuties);
        requiredQualifications = normalizeQuillContent(requiredQualifications);
        preferredQualifications = normalizeQuillContent(preferredQualifications);
        workingConditions= normalizeQuillContent(workingConditions);
        jobBenefits = normalizeQuillContent(jobBenefits);

        const minSalary = payRangeFrom ? Number(payRangeFrom) : null;
        const maxSalary = payRangeTo ? Number(payRangeTo) : null;

        if (minSalary !== null && maxSalary !== null && minSalary > maxSalary) {
            return res.status(400).json({
                message: "Minimum salary cannot be greater than maximum salary"
            });
        }

        connection = await database.getConnection();
        await connection.beginTransaction();

        await connection.query(`
            DELETE from jobSkillEmbeddings
            WHERE jobID = ?
            `,
            [jobID]
        );


        await connection.query(`
            DELETE from skillGapAnalysis
            WHERE jobID = ?
            `,
            [jobID]
        );


        await connection.query(`
            UPDATE jobs
            SET
                updatedByCompMemID = ?,
                jobTitle = ?,
                location = ?,
                workPlaceOption = ?,
                workType = ?,
                minSalary = ?,
                maxSalary = ?,
                jobOverview = ?,
                jobDuties = ?,
                requiredQualifications = ?,
                preferredQualifications = ?,
                workingConditions = ?,
                jobBenefits = ?,
                requiredYearsExp = ?,
                updatedAt = NOW(),
                extractedJobSkills = NULL,
                concatJobSkills = NULL,
                concatJobSkillsEmbedding = NULL,
                jobSearchText = NULL,
                jobSearchEmbedding = NULL
            WHERE jobID = ?
            AND companyID = ?
            `,
            [
                compMemID,
                jobTitle,
                location,
                workplaceOption,
                workType,
                minSalary,
                maxSalary,
                jobOverview,
                jobDuties,
                requiredQualifications,
                preferredQualifications,
                workingConditions,
                jobBenefits,
                yearsRequired,
                jobID,
                companyID
            ]
        );

        await connection.commit();

        processJob(jobID).catch((error) => {
            console.error("Job processing failed:", error);
        });

        return res.status(200).json({message: "job updated successfully"});

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Failed to rollback transaction:", rollbackError);
            }
        }

        console.error("Error in updateJobInfo:", error);
        return res.status(500).json({ message: "Internal server error occurred while updating job" });

    } finally {
        if (connection) connection.release()
    }
}

export async function closeJob(req, res) {
    const { jobID } = req.params
    const { companyID, compMemID } = req.user

    try {
        await database.query(`
            UPDATE jobs
            SET 
                status = 'closed',
                updatedByCompMemID = ?,
                updatedAt = NOW()
            WHERE jobID = ?
            AND companyID = ?
            `,
            [compMemID, jobID, companyID]
        );

        return res.status(200).json({ message: `Job ${jobID} has closed` })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Closing job failed" });
    }
}

export async function reOpenJob(req, res) {
    const { jobID } = req.params
    const { companyID, compMemID } = req.user

    try {
        await database.query(`
            UPDATE jobs
            SET 
                status = 'open',
                updatedByCompMemID = ?,
                updatedAt = NOW()
            WHERE jobID = ?
            AND companyID = ?
            `,
            [compMemID, jobID, companyID]
        );

        return res.status(200).json({ message: `Job ${jobID} has open` })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Closing job failed" });
    }
}

export async function viewJob(req, res) {
    const { jobID } = req.params;

    try {
        const [[specificJob]] = await database.query(`
            SELECT 
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