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
                j.location,
                j.workPlaceOption,
                j.workType,
                j.minSalary,
                j.maxSalary,
                j.createdAt,
                j.updatedAt,

                creator.firstName AS createdByFirstName,
                creator.lastName AS createdByLastName,

                updater.firstName AS updatedByFirstName,
                updater.lastName AS updatedByLastName

            FROM jobs j

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
            SELECT * 
            FROM jobs
            WHERE jobID = ?
            AND companyID = ?
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
    try {
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

        await database.query(`
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

        processJob(jobID).catch((error) => {
            console.error("Job processing failed:", error);
        });

        return res.status(200).json({message: "job updated successfully"});

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server occurred while updating job"});
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