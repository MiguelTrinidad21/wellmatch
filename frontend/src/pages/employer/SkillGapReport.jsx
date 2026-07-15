import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer"
import SkillGapLoader from "../../components/others/SkillGapLoader";
import MatchScore from "../../components/others/MatchScore";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import JobSkillEvidence from "../../components/popUps/JobSkillEvidence";
import ResumeViewerModal from "../../components/others/ResumeViewerModal";
import Translucent from "../../components/overlay/Translucent";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import { resumeStore } from "../../zustand/skillGapResume";
import defaultCover from "../../assets/defaultProfile.jpg"
import { MdOutlineEmail } from "react-icons/md";
import { SlLocationPin } from "react-icons/sl";
import { IoIosCheckmark } from "react-icons/io";
import { IoMdClose } from "react-icons/io";
import { GoInfo } from "react-icons/go";
import { FiBriefcase } from "react-icons/fi";
import { FiAward } from "react-icons/fi";
import { RiGraduationCapLine } from "react-icons/ri";
import axios from "axios";


export default function SkillGapReport() {

    const navigate = useNavigate();
    const { applicantID, jobID, resumeID } = useParams();
    const { currentUser } = userStore();
    const [verified, setVerified] = useState(false);

    const leftColRef = useRef(null);
    const [leftColHeight, setLeftColHeight] = useState(null);

    const [showEvidence, setShowEvidence] = useState(false);
    const [evidenceStatus, setEvidenceStatus] = useState("");
    const [resumeSkill, setResumeSkill] = useState("");
    const [resumeEvidence, setResumeEvidence] = useState("");
    const [jobSkill, setJobSkill] = useState("");
    const [jobEvidence, setJobEvidence] = useState("");
    const [ activeMatchEvidenceIndex, setActiveMatchEvidenceIndex] = useState(null);
    const [ activeMissingEvidenceIndex, setActiveMissingEvidenceIndex] = useState(null);


    const [skillGapLoaded, setSkillGapLoaded] = useState(false);
    const [showResumeViewer, setShowResumeViewer] = useState(false);

    const [workExp, setWorkExp] = useState([]);
    const [credentials, setCredentials] = useState([]);
    const [education, setEducation] = useState([]);
    const [selectedJob, setSelectedJob] = useState([]);
    
    const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);
    const loading = !skillGapLoaded

    useEffect(() => {
        async function checkEmployer() {
            try {
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    return;
                }

                await axios.get("/api/employer/authorize", {
                    params: {
                        employerID: currentUser.employerID
                    }
                });
                console.log(currentUser)

                setVerified(true);
            } catch (error) {
                console.log(error);
                setVerified(false);
            }
        }

        checkEmployer();
    }, [currentUser]);

    useEffect(() => {
        if (!leftColRef.current) return;

        const el = leftColRef.current;

        const updateHeight = () => {
            // Only lock height on md+ screens (two-column layout)
            if (window.innerWidth >= 768) {
                setLeftColHeight(el.offsetHeight);
            } else {
                setLeftColHeight(null);
            }
        };

        updateHeight();

        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(el);

        window.addEventListener("resize", updateHeight);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateHeight);
        };
    }, [skillGapLoaded]);

    useEffect(() => {
        async function getSkillGapReport() {
            try {
                const res = await axios.get("/api/employer/applications/skillGapReport", {
                    params: {
                        jobID,
                        resumeID
                    },
                    withCredentials: true
                });
                console.log(res.data.skillGapReport)
                setSkillGapAnalysis(res.data.skillGapReport);
                setSkillGapLoaded(true);
            } catch (error) {
                console.log(error);
            }
        }

        getSkillGapReport();
    }, [applicantID, jobID, resumeID]);

    useEffect(() => {
        async function getCandidateHistory() {
            try {
                const res = await axios.get("/api/employer/applications/candidateHistory", {
                    params: { applicantID },
                    withCredentials: true
                });

                setWorkExp(res.data.workExp);
                setCredentials(res.data.credentials);
                setEducation(res.data.education);

            } catch (error) {
                console.log(error);
            }
        }

        getCandidateHistory();
    }, [applicantID])

    useEffect(() => {
        async function getJob() {
            try {
                const jobDesc = await axios.get(`/api/employer/getAppliedJob`, {
                    params: { jobID },
                    withCredentials: true
                });

                setSelectedJob(jobDesc.data);
                // console.log(jobDesc.data)
            } catch (error) {
                console.log(error)
            }
        }

        getJob()
    }, [jobID])

    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden");
        }
    }, [loading, verified, navigate]);

    if (loading) {
        return <SkillGapLoader />
    }

    if (!verified) {
        return null;
    }

    return (
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />
                <Overlay />

                {showResumeViewer &&
                    <>
                        <Translucent />
                        <ResumeViewerModal
                        resumeID={resumeID}
                        onClose={() => setShowResumeViewer(false)}
                        user="employer"
                        />
                    </>
                }

                {
                    showEvidence &&
                    <JobSkillEvidence
                        status={evidenceStatus}
                        resumeSkill={resumeSkill}
                        resumeEvidence={resumeEvidence}
                        jobSkill={jobSkill}
                        jobEvidence={jobEvidence}
                        toggleFunc={() => setShowEvidence(false)} 
                    />     
                }    

                <div className="w-full min-h-[calc(100vh-64px)] p-6 md:py-10 md:px-15">

                    <div className="w-full grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
                        <div ref={leftColRef} className="w-full flex flex-col gap-4">
                            <section className="rounded-2xl shadow-md bg-white p-4">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-19 h-19 shrink-0">
                                        <img className="w-full h-full rounded-full object-cover" src={`${skillGapAnalysis.profilePhotoURL ? skillGapAnalysis.profilePhotoURL : defaultCover}`} alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-lg font-bold wrap-break-word">{`${skillGapAnalysis.firstName} ${skillGapAnalysis.lastName}`}</h1>
                                        <div className="flex items-start gap-2 w-full">
                                            <MdOutlineEmail className="shrink-0 mt-1" />
                                            <p className="wrap-break-word min-w-0">{skillGapAnalysis.email}</p>
                                        </div>
                                        {
                                            skillGapAnalysis.address &&
                                            <div className="flex items-start gap-2 w-full">
                                                <SlLocationPin className="shrink-0 mt-1" />
                                                <p className="wrap-break-word min-w-0">{skillGapAnalysis.address}</p>
                                            </div>
                                        }
                                    </div>
                                </div>

                                <div className="flex flex-col w-full justify-center items-center gap-4">
                                    <div className="rounded-2xl bg-[#2A1F54] w-65 p-4">
                                        <h1 className="text-white font-bold text-center mb-3">OVERALL MATCH SCORE</h1>
                                        <MatchScore type="overall" score={skillGapAnalysis.overallScore} />
                                        <p className="text-center text-white font-semibold mt-3">{skillGapAnalysis.scoresBreakdown.interpretation}</p>
                                    </div>

                                    <PrimaryButton onClick={() => setShowResumeViewer(true)} className="w-65" >View Resume</PrimaryButton>
                                </div>                                
                            </section>

                            <section className="rounded-2xl shadow-md bg-white p-4 w-full">
                                <h1 className="font-bold text-xl mb-5">Candidate History</h1>
                                <div className="w-full border-b-2 border-gray-100 mb-5">
                                    <p className="text-sm text-gray-700 font-semibold mb-3">WORK EXPERIENCE</p>

                                    {
                                        workExp.length === 0 ?
                                        <p className="my-5 text-center font-semibold text-gray-500">No data to show</p>
                                    :
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
                                    }
                                </div>

                                <div className="w-full border-b-2 border-gray-100 mb-5">
                                    <p className="text-sm text-gray-700 font-semibold mb-3">CERTIFICATIONS AND LICENSES</p>
                                    {
                                        credentials.length === 0 ?
                                        <p className="my-5 text-center font-semibold text-gray-500">No data to show</p>
                                    :
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
                                    }                                    
                                </div>

                                <div className="w-full mb-6">
                                    <p className="text-sm text-gray-700 font-semibold mb-3">EDUCATION</p>

                                    {
                                        education.length === 0 ?
                                            <p className="mt-5 text-center font-semibold text-gray-500">No data to show</p>
                                        :
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
                                    }
                                </div>
                            </section>
                        </div>

                        <div className="w-full flex flex-col gap-4 md:overflow-y-auto md:pr-1" style={leftColHeight ? { maxHeight: `${leftColHeight}px` } : undefined}>
                            <section className="rounded-2xl shadow-md bg-white p-4 w-full">
                                <p className="text-sm text-gray-400">APPLYING FOR</p>
                                <p className="font-bold text-lg">{selectedJob.jobTitle}</p>
                            </section>

                            <section className="rounded-2xl shadow-md bg-white p-4 w-full">
                                <p className="text-sm text-gray-400 mb-3">SCORES BREAKDOWN</p>
                                <div className={`bg-[#F4F1F8] rounded-xl grid ${selectedJob.preferredQualifications ? "grid-cols-2" : "grid-cols-1"} p-4`}>
                                    <div className="text-center">
                                        <MatchScore 
                                            type="breakdown"
                                            score={skillGapAnalysis.scoresBreakdown.coreSkillScore}
                                            className="w-25! h-25!"    
                                        />
                                        <p className="text-[12px] font-semibold mt-2">Required Skills</p>
                                        <p className="text-[12px]">Weighted 80%</p>
                                    </div>

                                    {selectedJob.preferredQualifications && 
                                        <div className="text-center">
                                            <MatchScore 
                                                type="breakdown"
                                                score={skillGapAnalysis.scoresBreakdown.secondarySkillScore}
                                                className="w-25! h-25!"    
                                            />
                                                <p className="text-[12px] font-semibold mt-2">Preferred Skills</p>
                                                <p className="text-[12px]">Weighted 20%</p>
                                        </div>                                    
                                    }
                                </div>                                
                            </section>

                            <section className="w-full grid grid-cols-1 gap-4">
                                <div className="p-4 rounded-2xl shadow-md bg-white border-l-4 border-l-green-600">
                                    <div className="flex gap-2 items-center mb-2">
                                        <div className="w-3 h-3 bg-green-600 inline-block rounded-full"></div>
                                        <h1 className="font-bold text-lg">Matched Skills</h1>
                                    </div>

                                    {
                                        skillGapAnalysis.matchedSkills?.length >= 1 ?
                                            <>
                                                {
                                                    skillGapAnalysis.matchedSkills?.filter((skill) => skill.skillType === "core").length >= 1 &&
                                                    <>
                                                        <h2 className="text-[12px] font-bold mb-1 text-green-700">REQUIRED SKILLS</h2>
                                                        <div className="w-full flex flex-col gap-1 mb-4 ">
                                                            {skillGapAnalysis.matchedSkills
                                                                ?.filter((skill) => skill.skillType === "core")
                                                                .map((skill, index) => (
                                                                    <div
                                                                        className="relative bg-[#F0FDF4] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.98] transition-transform duration-200 ease-in"
                                                                        key={`matched-core-${index}`} 
                                                                        onClick={() => {
                                                                             setActiveMatchEvidenceIndex(
                                                                                activeMatchEvidenceIndex === `matched-core-${index}` ? null : `matched-core-${index}`
                                                                            )                                                                       
                                                                            setEvidenceStatus("matched");
                                                                            setResumeSkill(skill.matchedResumeSkill);
                                                                            setResumeEvidence(skill.resumeEvidence);
                                                                            setJobSkill(skill.matchedJobSkill);
                                                                            setJobEvidence(skill.jobEvidence);
                                                                            setShowEvidence(true);
                                                                        }}
                                                                    >
                                                                        <div className="flex justify-center items-center w-5 h-5 rounded-full bg-green-600 ">
                                                                            <IoIosCheckmark className="text-white" size={50} />
                                                                        </div>
                                                                        <p className="flex-1 font-bold text-[#4A9E69]">{skill.matchedJobSkill}</p>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>                                                                                                
                                                    </>
                                                }

                                                {
                                                    skillGapAnalysis.matchedSkills?.filter((skill) => skill.skillType === "secondary").length >= 1 &&
                                                    <>
                                                        <h2 className="text-[12px] font-bold mb-1 text-green-700">PREFERRED SKILLS</h2>
                                                        <div className="w-full flex flex-col gap-1 mb-4 ">
                                                            {skillGapAnalysis.matchedSkills
                                                                ?.filter((skill) => skill.skillType === "secondary")
                                                                .map((skill, index) => (
                                                                    <div 
                                                                        key={`matched-second-${index}`}
                                                                        className="relative bg-[#F0FDF4] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.98] transition-transform duration-200 ease-in"
                                                                        onClick={() => {
                                                                            setActiveMatchEvidenceIndex(
                                                                                activeMatchEvidenceIndex === `matched-core-${index}` ? null : `matched-core-${index}`
                                                                            )                                                                            
                                                                            setEvidenceStatus("matched");
                                                                            setResumeSkill(skill.matchedResumeSkill);
                                                                            setResumeEvidence(skill.resumeEvidence);
                                                                            setJobSkill(skill.matchedJobSkill);
                                                                            setJobEvidence(skill.jobEvidence);
                                                                            setShowEvidence(true);
                                                                        }}
                                                                    >
                                                                        <div className="flex justify-center items-center w-5 h-5 rounded-full bg-green-600 ">
                                                                            <IoIosCheckmark className="text-white" size={50} />
                                                                        </div>
                                                                        <p className="flex-1 font-bold text-[#4A9E69]">{skill.matchedJobSkill}</p>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>                                                    
                                                    </>
                                                }
                                                <p className="text-[12px] text-gray-400 italic">Click/tap badge for job requirement evidence</p>
                                            </>

                                        :
                                            <p className="text-sm font-medium ml-5 mt-5 mb-1">No matched skills</p>
                                    }
                                    
                                </div>

                                <div className="p-4 rounded-2xl shadow-md bg-white border-l-4 border-l-red-600">
                                    <div className="flex gap-2 items-center mb-2">
                                        <div className="w-3 h-3 bg-red-600 inline-block rounded-full"></div>
                                        <h1 className="font-bold text-lg">Skill Gaps</h1>
                                    </div>

                                    {
                                        skillGapAnalysis.missingSkills?.length >= 1 ?
                                        <>
                                            {
                                                skillGapAnalysis.missingSkills?.filter((skill) => skill.skillType === "core").length >= 1 &&
                                                <>
                                                    <h2 className="text-[12px] font-bold mb-1 text-red-600">CORE GAPS - HIGH PRIORITY</h2>
                                                    <div className=" w-full flex flex-col gap-1 mb-4 ">
                                                        {skillGapAnalysis.missingSkills
                                                            ?.filter((skill) => skill.skillType === "core")
                                                            ?.map((skill, index) => (
                                                                <div 
                                                                    key={`missing-core-${index}`} 
                                                                    className="relative bg-[#FFF1F2] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.98] transition-transform duration-200 ease-in"
                                                                        onClick={() => {
                                                                            setActiveMissingEvidenceIndex(
                                                                                activeMissingEvidenceIndex === `missing-core-${index}` ? null : `missing-core-${index}`
                                                                            )                                                                            
                                                                            setEvidenceStatus("missing");
                                                                            setJobSkill(skill.parentSkill);
                                                                            setJobEvidence(skill.jobEvidence);
                                                                            setShowEvidence(true);
                                                                        }}
                                                                >

                                                                    <div className="flex justify-center items-center w-5 h-5 rounded-full bg-red-600 ">
                                                                        <IoMdClose className="text-white" />
                                                                    </div>
                                                                    <p className="flex-1 font-bold text-[#BE123C]">{skill.parentSkill}</p>
                                                                </div>
                                                                )
                                                            )
                                                        }
                                                    </div>                                                    
                                                </>
                                            }

                                            {
                                                skillGapAnalysis.missingSkills?.filter((skill) => skill.skillType === "secondary").length >= 1 &&
                                                <>
                                                    <h2 className="text-[12px] font-bold mb-1 text-[#92400E]">SECONDARY - OPTIONAL</h2>
                                                    <div className="w-full flex flex-col gap-1 mb-4 ">
                                                        {skillGapAnalysis.missingSkills
                                                            ?.filter((skill) => skill.skillType === "secondary")
                                                            ?.map((skill, index) => (
                                                                <div 
                                                                    key={`missing-second-${index}`} 
                                                                    className="relative bg-[#FFFBEB] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.97] transition-transform duration-200 ease-in"
                                                                        onClick={() => {
                                                                            setActiveMissingEvidenceIndex(
                                                                                activeMissingEvidenceIndex === `missing-core-${index}` ? null : `missing-core-${index}`
                                                                            )                                                                            
                                                                            setEvidenceStatus("missing");
                                                                            setJobSkill(skill.parentSkill);
                                                                            setJobEvidence(skill.jobEvidence);
                                                                            setShowEvidence(true);
                                                                        }}
                                                                >

                                                                    <div className="flex justify-center items-center w-5 h-5 rounded-full bg-[#F59E0B] ">
                                                                        <IoMdClose className="text-white" />
                                                                    </div>
                                                                    <p className="flex-1 font-bold text-[#92400E]">{skill.parentSkill}</p>
                                                                </div>
                                                                )
                                                            )
                                                        }                
                                                    </div>                                                
                                                </>
                                            }
                                            <p className="text-[12px] text-gray-400 italic">Click/tap badge for job requirement evidence</p>
                                        </>
                                    :
                                        <p className="text-sm font-medium ml-5 mt-5 mb-1">No skill gaps</p>
                                    }
                                    
                                </div>                            
                            </section>

                            <section className="rounded-2xl shadow-md bg-white p-4 w-full">
                                <h1 className="text-lg font-bold mb-3">Match Score Insight</h1>
                                <p className="text-sm text-justify mb-3 indent-5">{skillGapAnalysis.scoreExplanation}</p>

                                <div className="w-full flex items-center gap-3 bg-[#F0FDF4] rounded-md text-green-600 p-2">
                                    <GoInfo size={50} />
                                    <p className="text-[12px] font-semibold">To ensure fairness, this evaluation considers only information explicitly stated in the resume.</p>
                                </div>
                            </section>                            

                        </div>
                    </div>

                </div>            
            </div>
        </>
    )
}