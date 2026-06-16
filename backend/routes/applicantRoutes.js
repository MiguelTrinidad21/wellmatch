import express from "express";
import handleMulterResumeUpload from "../middlewares/handleResumes.js";
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

import { getRecommendedJobs, searchJobs } from "../controllers/applicant/jobControllers.js";

const router = express.Router();

router.get("/authorize", verifyToken, isApplicant, (req, res) => {
    return res.status(200).json({message: "Applicant is authorized"})
})
router.get("/recommendedJobs", verifyToken, isApplicant, getRecommendedJobs);
router.get("/searchJobs", verifyToken, isApplicant, searchJobs);


router.post("/register", handleMulterResumeUpload, registerApplicant)
router.post("/login", loginApplicant);
router.post("/logout", logoutApplicant);


export default router;