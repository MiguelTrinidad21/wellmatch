import express from "express";

import handleApplicantPhotoUpload from "../middlewares/handleApplicantPhotos.js";
import handleMulterResumeUpload from "../middlewares/handleResumes.js";
import { skillGapController } from "../controllers/applicant/skillGapController.js";
import { 
    changeEmail, 
    changePassword,
    deleteAccount
} from "../controllers/applicant/accountSettings.js";

import { 
    registerApplicant, 
    loginApplicant,
    logoutApplicant
} from "../controllers/applicant/authenticateApplicants.js";

import  {
    verifyToken,
    isApplicant,
    isEmployer
} from "../middlewares/authorizeUser.js"

import { 
    getRecommendedJobs, 
    searchJobs, 
    getSpecificJob,
    saveJob,
    unsaveJob,
    getAllSavedJobs
} from "../controllers/applicant/jobControllers.js";

import { 
    getAllResumes, 
    uploadAndAddResume, 
    viewResume,
    debugResume,
    makeResumeDefault,
    deleteResume
} from "../controllers/applicant/resumeControllers.js";


import { 
    addWorkExp,
    getAllWorkExp,
    deleteWorkExp,
    addCredential,
    getCredentials,
    deleteCredential,
    addEducation,
    getEducation,
    deleteEducation,
    updateInfo
} from "../controllers/applicant/manageProfileInfo.js";

import { 
    submitApplication, 
    fetchApplications,
    withdrawApplication
} from "../controllers/applicant/jobApplicationControllers.js";


const router = express.Router();

router.get("/authorize", verifyToken, isApplicant, (req, res) => {
    return res.status(200).json({
        message: "Applicant is authorized",
        updatedInfo: req.user
    })
})
router.get("/recommendedJobs", verifyToken, isApplicant, getRecommendedJobs);
router.get("/searchJobs", verifyToken, isApplicant, searchJobs);
router.get("/viewJob/:jobID", verifyToken, isApplicant, getSpecificJob);
router.get("/getAllResumes", verifyToken, isApplicant, getAllResumes);
router.get("/viewResume/:resumeID", verifyToken, isApplicant, viewResume)
router.get("/getWorkExp", verifyToken, isApplicant, getAllWorkExp)
router.get("/getCredentials", verifyToken, isApplicant, getCredentials)
router.get("/getEducation", verifyToken, isApplicant, getEducation)
router.get("/applications", verifyToken, isApplicant, fetchApplications)
router.get("/getSavedJobs", verifyToken, isApplicant, getAllSavedJobs)


router.get("/debug-resume", debugResume)

router.post("/:jobID/:resumeID/skillgap", verifyToken, isApplicant, skillGapController);
router.post("/register", handleMulterResumeUpload, registerApplicant)
router.post("/login", loginApplicant);
router.post("/logout", logoutApplicant);
router.post("/uploadResume", verifyToken, isApplicant, handleMulterResumeUpload, uploadAndAddResume)
router.post("/addWorkExp", verifyToken, isApplicant, addWorkExp)
router.post("/addCredential", verifyToken, isApplicant, addCredential)
router.post("/addEducation", verifyToken, isApplicant, addEducation)
router.post("/submitApplication/:jobID", verifyToken, isApplicant, submitApplication)
router.post("/saveJob", verifyToken, isApplicant, saveJob)

router.patch("/editProfileInfo", verifyToken, isApplicant, handleApplicantPhotoUpload, updateInfo)
router.patch("/resume/makeDefault", verifyToken, isApplicant, makeResumeDefault)
router.patch("/changeEmail", verifyToken, isApplicant, changeEmail)
router.patch("/changePassword", verifyToken, isApplicant, changePassword)


router.delete("/delete/workExp", verifyToken, isApplicant, deleteWorkExp)
router.delete("/delete/credential", verifyToken, isApplicant, deleteCredential)
router.delete("/delete/education", verifyToken, isApplicant, deleteEducation)
router.delete("/delete/resume", verifyToken, isApplicant, deleteResume)
router.delete("/withdrawApplication/:applicationID", verifyToken, isApplicant, withdrawApplication)
router.delete("/unsaveJob", verifyToken, isApplicant, unsaveJob)
router.delete("/deleteAccount", verifyToken, isApplicant, deleteAccount)


export default router;