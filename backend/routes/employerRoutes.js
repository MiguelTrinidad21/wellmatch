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

import handleMulterUpload from "../middlewares/handleCompanyPhotos.js";
import updateCompanyImages from "../controllers/employer/updateCompany.js";
import { sendEmployerInvitationEmail } from "../controllers/employer/inviteEmployer.js";
import { 
    postJob, 
    getJobs,
    getSpecificJob,
    updateJobInfo,
    closeJob
 } from "../controllers/employer/jobControllers.js";

 import { editDetails } from "../controllers/employer/employerAccountSettings.js";

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




router.patch("/editCompany", verifyToken, handleMulterUpload, updateCompanyImages);
router.patch("/job/close/:jobID", verifyToken, isEmployer, closeJob)
router.patch("/editPersonalDetails", verifyToken, isEmployer, editDetails)

router.put("/updateJob/:jobID", verifyToken, isEmployer, updateJobInfo)

export default router;