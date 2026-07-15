import express from "express";

import { 
    registerAdmin, 
    loginEmployer, 
    logoutEmployer,
    verifyInvitationToken,
    registerCoEmployer
} from "../controllers/employer/authenticateEmployers.js";

import { 
    verifyToken, 
    isEmployer, 
    isAdmin 
} from "../middlewares/authorizeUser.js";

import { 
    getCompany, 
    getCompanyMembers
 } from "../controllers/employer/getCompanyInfo.js"; 

import { 
    postJob, 
    getJobs,
    getSpecificJob,
    updateJobInfo,
    closeJob,
    reOpenJob,
    viewJob
} from "../controllers/employer/jobControllers.js";

import { 
    updatePersonalDetails,
    changePassword,
    deleteAccount
} from "../controllers/employer/employerAccountSettings.js";

import { 
    updateStatus,
    rejectApplicant,
    rejectAllApplicants 
} from "../controllers/employer/updateJobApplications.js";

import {
    getJobInfo,
    getSkillGapReport,
    getCandidateHistory
} from "../controllers/employer/skillGapController.js"

import {
    getEmployerInfo,
    changePermission,
    removeEmployer
} from "../controllers/employer/manageEmployers.js"

import handleMulterUpload from "../middlewares/handleCompanyPhotos.js";
import updateCompanyImages from "../controllers/employer/updateCompany.js";
import { sendEmployerInvitationEmail } from "../controllers/employer/inviteEmployer.js";
import { fetchApplicants } from "../controllers/employer/viewingApplicants.js";
import { viewResume } from "../controllers/employer/resumeViewer.js";


const router = express.Router();

router.post("/register", registerAdmin);
router.post("/registerCoEmployer/:token", registerCoEmployer);
router.post("/login", loginEmployer);
router.post("/logout", logoutEmployer);
router.post("/companyProfile/invite", verifyToken, isAdmin, sendEmployerInvitationEmail)
router.post("/postJob", verifyToken, isEmployer, postJob)



router.get("/authorize", verifyToken, isEmployer, (req, res) => {
    return res.status(200).json({message: "Employer is authorized"});
})
router.get("/authorizeAdmin", verifyToken, isAdmin, (req, res) => {
    return res.status(200).json({message: "Admin is authorized"});
})
router.get("/company", verifyToken, isEmployer, getCompany);
router.get("/companyMembers", verifyToken, isEmployer, getCompanyMembers);
router.get("/invitations/verify/:token", verifyInvitationToken);
router.get("/getJobs", verifyToken, isEmployer, getJobs);
router.get("/jobs/:jobID", verifyToken, isEmployer, getSpecificJob);
router.get("/fetchApplicants", verifyToken, isEmployer, fetchApplicants);
router.get("/applications/skillGapReport", verifyToken, isEmployer, getSkillGapReport);
router.get("/applications/candidateHistory", verifyToken, isEmployer, getCandidateHistory);
router.get("/getAppliedJob", verifyToken, isEmployer, getJobInfo);
router.get("/viewResume/:resumeID", verifyToken, isEmployer, viewResume)
router.get("/viewJob/:jobID", verifyToken, isEmployer, viewJob)
router.get("/getEmployerInfo", verifyToken, isAdmin, getEmployerInfo)

router.patch("/editCompany", verifyToken, handleMulterUpload, updateCompanyImages);
router.patch("/job/close/:jobID", verifyToken, isEmployer, closeJob)
router.patch("/job/reOpen/:jobID", verifyToken, isEmployer, reOpenJob)
router.patch("/updatePersonalDetails", verifyToken, isEmployer, updatePersonalDetails)
router.patch("/changePassword", verifyToken, isEmployer, changePassword)
router.patch("/updateApplicationStatus", verifyToken, isEmployer, updateStatus)
router.patch("/rejectApplicant", verifyToken, isEmployer, rejectApplicant)
router.patch("/applications/rejectAll", verifyToken, isEmployer, rejectAllApplicants)
router.patch("/editPermission", verifyToken, isAdmin, changePermission)

router.put("/updateJob/:jobID", verifyToken, isEmployer, updateJobInfo)

router.delete("/deleteAccount", verifyToken, isEmployer, deleteAccount)
router.delete("/removeEmployer", verifyToken, isEmployer, removeEmployer)



export default router;