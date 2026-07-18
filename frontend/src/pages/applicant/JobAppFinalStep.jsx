import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer"
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import Translucent from "../../components/overlay/Translucent";
import ErrorBox from "../../components/popUps/ErrorBox";
import defaultCover from "../../assets/defaultCover.jpg"
import { IoChevronDown } from "react-icons/io5";
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import { resumeStore } from "../../zustand/skillGapResume";
import axios from "axios";
import { FiBriefcase } from "react-icons/fi";
import { FiAward } from "react-icons/fi";
import { RiGraduationCapLine } from "react-icons/ri";
import { BiLoaderAlt } from "react-icons/bi";
import ApplicantSideBar from "../../components/navBars/ApplicantSideBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";


export default function JobAppFinalStep() {
    const navigate = useNavigate();
    const { currentUser } = userStore();
    const { resumeToAnalyze, selectedYears, clearResumeToAnalyze } = resumeStore();

    const { jobID } = useParams();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);

    const [currentJob, setCurrentJob] = useState({});

    const [workExp, setWorkExp] = useState([]);
    const [credentials, setCredentials] = useState([]);
    const [education, setEducation] = useState([]);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState("");

    

    useEffect(() => {
        async function checkApplicant() {
            try {
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    return;
                }

                await axios.get("/api/applicant/authorize", {
                    params: {
                        applicantID: currentUser.applicantID
                    }
                });

                setVerified(true);
            } catch (error) {
                console.log(error);
                setVerified(false);
            } finally {
                
                setLoading(false);
            }
        }

        checkApplicant();
    }, [currentUser]);

    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden");
        }
    }, [loading, verified, navigate]);

    useEffect(() => {
        async function getJobInfo() {
            try {
                const result = await axios.get(`/api/applicant/viewJob/${jobID}`, {
                    withCredentials: true
                });
    
                setCurrentJob(result.data);
                
            } catch (error) {
                console.log(error);
            }
        }

        getJobInfo();
    }, []);

    useEffect(() => {
        async function getWorkExp() {
            try {
                const allWorkExps = await axios.get("/api/applicant/getWorkExp", {
                    params: {applicantID: currentUser.id},
                    withCredentials: true
                });
                console.log(allWorkExps.data.workExperiences)
                setWorkExp(allWorkExps.data.workExperiences);

            } catch (error) {
                console.log(error);
            }
        }

        getWorkExp();
    }, []);

    useEffect(() => {
        async function getCredentials() {
            try {
                const allCredentials = await axios.get("/api/applicant/getCredentials", {
                    params: {applicantID: currentUser.id},
                    withCredentials: true
                });
                setCredentials(allCredentials.data.credentials);

            } catch (error) {
                console.log(error);
            }
        }

        getCredentials();
    }, []);

    useEffect(() => {
        async function getEducation() {
            try {
                const allEducation = await axios.get("/api/applicant/getEducation", {
                    params: {applicantID: currentUser.id},
                    withCredentials: true
                });

                setEducation(allEducation.data.education);

            } catch (error) {
                console.log(error);
            }
        }

        getEducation();
    }, []);

    function closeConfirmBox() {
        setIsSubmitted(false);
        navigate("/applicant/jobApplications");
    }

    async function submitApplication() {
        setIsSubmitting(true);

        try {
            await axios.post(`/api/applicant/submitApplication/${jobID}`, {
                resumeID: resumeToAnalyze.resumeID,
                yearsExp: selectedYears,
                jobTitle: currentJob.jobTitle,
                companyName: currentJob.companyName,
            },
            { withCredentials: true }
        )
            setIsSubmitted(true);
            clearResumeToAnalyze();

        } catch (error) {
            console.log(error);
            setErrors(error?.response?.data?.message)
        } finally{
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return <Loading />
    }

    if (!verified) {
        return null;
    }


    return (
        <div className="lg:flex relative w-full">
            <ApplicantSideBar />
            <SideBarOverlay />
            
            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />

                {
                    isSubmitted && (
                        <>
                            <Translucent />
                            <ConfirmationBox
                                text="Job application submitted successfuly"
                                onClick={closeConfirmBox}
                                buttonText="View Application"
                            />
                        </>
                    )
                }

                {
                    errors && 
                    <ErrorBox 
                        heading="Submission rejected!"
                        text={errors}
                        onClick={() => setErrors("")}
                    />
                }
                
                <div className="w-full min-h-[calc(100vh-64px)] p-6 flex flex-col justify-center items-center gap-5 md:p-15">
                    <div className="w-full flex gap-3 md:w-fit">
                        <div className="w-30 rounded-lg">
                            <img className="w-full object-cover rounded-lg" src={currentJob.profilePhotoURL ? currentJob.profilePhotoURL : defaultCover} alt="" />
                        </div>

                        <div className="flex-1">
                            <p className="text-sm text-gray-500">Applying for</p>
                            <h1 className="text-xl font-bold text-gray-900">{currentJob.jobTitle}</h1>
                            <p className="text-gray-700 font-semibold">{currentJob.companyName}</p>
                            {/* <Link to={`/applicant/viewJob/${jobID}`} className="underline underline-offset-4 text-sm text-blue-600 font-medium">View job description</Link> */}
                        </div>
                    </div>

                    <div className="bg-white shadow-lg rounded-2xl p-4 w-full md:max-w-120 lg:max-w-150 md:p-8">
                        <h2 className="font-bold text-xl mb-3">Review WellMatch Profile</h2>
                        <p className="text-[12px] text-gray-500 mb-5 font-semibold md:text-sm">Your profile is part of your job application. Make sure you review it carefully.</p>

                        <div className="w-full border-b border-gray-300 mb-10 pb-5">
                            <p className="text-sm text-gray-700 font-bold mb-3">WORK EXPERIENCE</p>
                            {
                                workExp.length > 0 ?
                                    workExp?.map((item) => (
                                        <div key={item.workExpID} className="flex gap-3 pb-5">
                                            <div className="p-2 w-10 h-10 rounded-full border-2 border-[#D4D8FC] bg-[#EEF2FF]">
                                                <FiBriefcase size={20} className="text-[#6366F1] m-auto" />
                                            </div>
                                            <div className="flex-1">
                                                <h1 className="font-bold text-lg mb-1">{item.jobTitle}</h1>
                                                <p className="text-[#6366F1] font-semibold mb-1">{item.companyName}</p>
                                                <p className="text-gray-500 font-semibold text-[13px]">{`${item.startDate} - ${item.endDate}`}</p>
                                            </div>
                                        </div>

                                    ))
                                :
                                    <p className="my-5 text-sm font-medium text-center text-gray-600">No work experience added yet</p>
                            }
                        </div>

                        <div className="w-full border-b border-gray-300 mb-10 pb-5">
                            <p className="text-sm text-gray-700 font-bold mb-3">CERTIFICATIONS AND LICENSES</p>
                            {
                                credentials.length > 0 ?
                                    credentials?.map((item) => (
                                        <div key={item.credentialID} className="flex gap-3 pb-5">
                                            <div className="p-2 w-10 h-10 rounded-full border-2 border-[#FDE9C1] bg-[#FFFBEB]">
                                                <FiAward size={20} className="text-[#F59E0B] m-auto" />
                                            </div>
                                            <div className="flex-1">
                                                <h1 className="font-bold text-lg mb-1">{item.credentialTitle}</h1>
                                                <p className="text-[#6366F1] font-semibold mb-1">{item.issuedBy}</p>
                                                <p className="text-gray-500 font-semibold text-[13px]">{`${item.issueDate} - ${item.expiryDate ? item.expiryDate : "No expiry"}`}</p>
                                            </div>
                                        </div>

                                    ))
                                :
                                    <p className="my-5 text-sm font-medium text-center text-gray-600">No credentials added yet</p>
                            }
                        </div>

                        <div className="w-full mb-10 pb-5">
                            <p className="text-sm text-gray-700 font-bold mb-3">EDUCATION</p>
                            {
                                education.length > 0 ?
                                    education?.map((item) => (
                                        <div key={item.educationID} className="flex gap-3 pb-5">
                                            <div className="p-2 w-10 h-10 rounded-full border-2 border-[#C6F0DE] bg-[#F0FDF4]">
                                                <RiGraduationCapLine size={20} className="text-[#10B981] m-auto" />
                                            </div>
                                            <div className="flex-1">
                                                <h1 className="font-bold text-lg mb-1">{item.courseName}</h1>
                                                <p className="text-[#6366F1] font-semibold mb-1">{item.institution}</p>
                                                {
                                                    item.graduatedAt ? 
                                                        <p className="text-gray-500 font-semibold text-[13px]">{`Graduated at ${item.issueDate}`}</p>
                                                    :    
                                                        <p className="text-gray-500 font-semibold text-[13px]">{`Expected to finish at ${item.willFinishAt}`}</p>
                                                }
                                            </div>
                                        </div>

                                    ))
                                :
                                    <p className="my-5 text-sm font-medium text-center text-gray-600">No education added yet</p>
                            }
                        </div>
                        
                        <div className="flex justify-between w-full">
                            <PrimaryButton disabled={isSubmitting} to={`/applicant/viewJob/${jobID}/apply`} className="bg-gray-200 text-black! px-4">Back</PrimaryButton>
                            <div className="flex gap-2" >
                                <SecondaryButton disabled={isSubmitting} to="/applicant/myProfile" className="px-5">Edit</SecondaryButton>
                                <PrimaryButton className={isSubmitting ? "opacity-50" : undefined} disabled={isSubmitting} onClick={submitApplication}>
                                    {
                                        isSubmitting ?
                                            <span className="flex gap-2 items-center justify-center">
                                                <BiLoaderAlt size={20} className="animate-spin" />
                                                Submit
                                            </span>
                                        :
                                            "Submit"
                                    }
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}