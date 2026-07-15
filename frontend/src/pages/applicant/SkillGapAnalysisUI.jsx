import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import ApplicantSideBar from "../../components/navBars/ApplicantSideBar";
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
import defaultProfile from "../../assets/defaultProfile.jpg"
import { MdOutlineEmail } from "react-icons/md";
import { SlLocationPin } from "react-icons/sl";
import { IoIosCheckmark } from "react-icons/io";
import { IoMdClose } from "react-icons/io";
import { GoInfo } from "react-icons/go";
import { FaBookOpen } from "react-icons/fa";
import { ImWrench } from "react-icons/im";
import { BsAwardFill } from "react-icons/bs";
import axios from "axios";


export default function SkillGapAnalysisUI() {   
    
    const navigate = useNavigate();
    
    const { resumeToAnalyze, selectedOption } = resumeStore();
    const { currentUser } = userStore();
    const { jobID, resumeID } = useParams();

    const leftColRef = useRef(null);
    const [leftColHeight, setLeftColHeight] = useState(null);
    
    const [verified, setVerified] = useState(false);

    const [showEvidence, setShowEvidence] = useState(false);
    const [evidenceStatus, setEvidenceStatus] = useState("");
    const [resumeSkill, setResumeSkill] = useState("");
    const [resumeEvidence, setResumeEvidence] = useState("");
    const [jobSkill, setJobSkill] = useState("");
    const [jobEvidence, setJobEvidence] = useState("");
    const [ activeMatchEvidenceIndex, setActiveMatchEvidenceIndex] = useState(null);
    const [ activeMissingEvidenceIndex, setActiveMissingEvidenceIndex] = useState(null);

    const [skillGapLoaded, setSkillGapLoaded] = useState(false);
    const [jobLoaded, setJobLoaded] = useState(false);
    const loading = !skillGapLoaded || !jobLoaded;

    const [selectedJob, setSelectedJob] = useState(null);
    const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);

    const [showResumeViewer, setShowResumeViewer] = useState(false);

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
                console.log(currentUser)

                setVerified(true);
            } catch (error) {
                console.log(error);
                setVerified(false);
            }
        }

        checkApplicant();
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
    }, [skillGapLoaded, jobLoaded]);

    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden");
        }
    }, [loading, verified, navigate]);

    useEffect(() => {

        async function getSkillGapReport() {
            console.log(resumeToAnalyze)

            try {

                const skillGapReport = await axios.post(
                    `/api/applicant/${jobID}/${resumeID}/skillgap`,
                    {
                        withCredentials: true
                    }
                );                    
                console.log(skillGapReport.data.skillGapReport);

                setSkillGapAnalysis(skillGapReport.data.skillGapReport);
            } catch (error) {
                console.log(error);
            } finally {
                setSkillGapLoaded(true);
            }
        }

        getSkillGapReport();

    }, [])

    useEffect(() => {
        async function getJob() {
            try {
                const jobDesc = await axios.get(`/api/applicant/viewJob/${jobID}`, {
                    withCredentials: true
                })

                setSelectedJob(jobDesc.data);
                console.log(jobDesc.data)
            } catch (error) {
                console.log(error)
            } finally {
                setJobLoaded(true);
            }
        }

        getJob()
    }, [jobID])


    if (loading) {
        return <SkillGapLoader />
    }

    if (!verified) {
        return null;
    }

    if (!selectedJob || !skillGapAnalysis) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#F3F4F6]">
                <p className="text-gray-600 text-sm">Something went wrong. Please refresh and try again.</p>
            </div>
        );
    }

    return (
        <div className="lg:flex relative w-full">
            <ApplicantSideBar />
            <SideBarOverlay />

            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />

                {showResumeViewer &&
                    <>
                        <Translucent />
                        <ResumeViewerModal
                        resumeID={resumeID}
                        onClose={() => setShowResumeViewer(false)}
                        user="applicant"
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

                <div className="w-full min-h-[calc(100vh-64px)] p-6 md:p-15 lg:p-10 xl:px-30">                    
                    <div className="w-full grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start xl:flex">

                        <div ref={leftColRef} className="w-full flex flex-col gap-4 xl:w-100">
                            <section className="rounded-2xl shadow-sm bg-white p-4 border-2 border-[#E8ECEF]">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-19 h-19 shrink-0">
                                        <img className="w-full h-full rounded-full object-cover" src={`${currentUser.profilePhoto ? currentUser.profilePhoto : defaultProfile}`} alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-lg font-bold wrap-break-word">{`${currentUser.firstName} ${currentUser.lastName}`}</h1>
                                         <div className="flex items-start gap-2 w-full">
                                            <MdOutlineEmail className="shrink-0 mt-1" />
                                            <p className="wrap-break-word min-w-0">{currentUser.email}</p>
                                        </div>
                                        {
                                            currentUser.address &&
                                            <div className="flex items-start gap-2 w-full">
                                                <SlLocationPin className="shrink-0 mt-1" />
                                                <p className="wrap-break-word min-w-0">{currentUser.address}</p>
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

                                    <PrimaryButton onClick={() => setShowResumeViewer(true)} className="w-65 hover:bg-green-600 transition-colors duration-200 ease-in" >View Resume</PrimaryButton>
                                </div>

                            </section>

                            <section className="rounded-2xl shadow-sm bg-white p-4 w-full border-2 border-[#E8ECEF]">
                                <h1 className="font-bold text-lg">Job Requirements</h1>

                                <h2 className="font-semibold">Required</h2>
                                <div
                                    className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                    dangerouslySetInnerHTML={{
                                        __html: selectedJob.requiredQualifications?.replace(/&nbsp;/g, ' ')
                                    }}
                                />

                                {selectedJob.preferredQualifications &&
                                    <>
                                        <h2 className="font-semibold mt-4">Preferred</h2>
                                        <div
                                            className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                            dangerouslySetInnerHTML={{
                                                __html: selectedJob.preferredQualifications?.replace(/&nbsp;/g, ' ')
                                            }}
                                        />  
                                    </>
                                }
                            </section>
                        </div>

                        <div style={leftColHeight ? { maxHeight: `${leftColHeight}px` } : undefined} className="w-full flex flex-col gap-4 md:overflow-y-auto md:pr-1 xl:flex-1">
                            <section className="rounded-2xl shadow-sm bg-white p-4 w-full border-2 border-[#E8ECEF]">
                                <p className="text-sm text-gray-600 font-semibold">APPLYING FOR</p>
                                <p className="font-bold text-lg xl:text-xl">{selectedJob.jobTitle}</p>
                            </section>

                            <section className="rounded-2xl shadow-sm bg-white p-4 w-full border-2 border-[#E8ECEF]">
                                <p className="text-sm text-gray-600 mb-3 font-semibold">SCORES BREAKDOWN</p>
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

                            <section className="w-full grid grid-cols-1 gap-4 border-2 border-[#E8ECEF]">
                                <div className="p-4 rounded-2xl shadow-sm bg-white border-l-4 border-l-green-600">
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
                                                        <div className="w-full flex flex-col gap-1 mb-4 xl:flex-row xl:gap-3 xl:flex-wrap xl:mb-10 ">
                                                            {skillGapAnalysis.matchedSkills
                                                                ?.filter((skill) => skill.skillType === "core")
                                                                .map((skill, index) => (
                                                                    <div
                                                                        className="relative bg-[#F0FDF4] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.98] transition-transform duration-200 ease-in cursor-pointer"
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
                                                        <div className="w-full flex flex-col gap-1 mb-4 xl:flex-row xl:gap-3 xl:flex-wrap xl:mb-10">
                                                            {skillGapAnalysis.matchedSkills
                                                                ?.filter((skill) => skill.skillType === "secondary")
                                                                .map((skill, index) => (
                                                                    <div 
                                                                        key={`matched-second-${index}`}
                                                                        className="relative bg-[#F0FDF4] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.98] transition-transform duration-200 ease-in cursor-pointer"
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
                                            </>

                                        :
                                            <p>No matched skills</p>
                                    }
                                    <p className="text-[12px] text-gray-500 italic xl:text-sm">Click/tap badge for job requirement evidence</p>
                                </div>

                                <div className="p-4 rounded-2xl shadow-sm bg-white border-l-4 border-l-red-600">
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
                                                    <div className=" w-full flex flex-col gap-1 mb-4 xl:flex-row xl:gap-3 xl:flex-wrap xl:mb-10">
                                                        {skillGapAnalysis.missingSkills
                                                            ?.filter((skill) => skill.skillType === "core")
                                                            ?.map((skill, index) => (
                                                                <div 
                                                                    key={`missing-core-${index}`} 
                                                                    className="relative bg-[#FFF1F2] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.98] transition-transform duration-200 ease-in cursor-pointer"
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
                                                    <div className="w-full flex flex-col gap-1 mb-4 xl:flex-row xl:gap-3 xl:flex-wrap xl:mb-10">
                                                        {skillGapAnalysis.missingSkills
                                                            ?.filter((skill) => skill.skillType === "secondary")
                                                            ?.map((skill, index) => (
                                                                <div 
                                                                    key={`missing-second-${index}`} 
                                                                    className="relative bg-[#FFFBEB] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.97] transition-transform duration-200 ease-in cursor-pointer"
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
                                        </>
                                    :
                                        <p>No skill gaps detected</p>
                                    }
                                    <p className="text-[12px] text-gray-500 italic xl:text-sm">Click/tap badge for job requirement evidence</p>
                                </div>


                            </section>

                            <section className="rounded-2xl shadow-sm bg-white p-4 w-full border-2 border-[#E8ECEF]">
                                <h1 className="text-lg font-bold mb-3">How Your Score Was Reached</h1>
                                <p className="text-sm text-justify mb-3 indent-5">{skillGapAnalysis.scoreExplanation}</p>

                                <div className="w-full flex gap-3 bg-[#F0FDF4] rounded-md text-green-600 p-2">
                                    <GoInfo className="h-10 w-10" />
                                    <p className="text-[12px] font-semibold">To ensure fairness, this evaluation considers only information explicitly stated in the resume.</p>
                                </div>
                            </section>

                            

                            <div className="mt-8 mb-5">
                                <h1 className="font-semibold text-[20px] md:text-[22px] lg:text-[24px]">Recommended Learning Plan</h1>
                                <p className="text-sm text-gray-500">Personalized recommendations to improve your match for this position.</p>
                            </div>
                            {
                                skillGapAnalysis.upskillingReco.map((reco, index) => {
                                    const isPriority = reco.label === "Priority";

                                    return (
                                        <section
                                            key={index}
                                            className={`rounded-2xl shadow-sm bg-white p-4 w-full border border-[#E8ECEF] border-l-4 border-l-[#16C47F]`}
                                        >
                                            <div className="flex justify-between items-center mb-4 gap-3">
                                                <h2 className="font-semibold text-[15px] xl:text-lg">{reco.skillGap}</h2>
                                                <div
                                                    className={`text-[11px] xl:text-sm font-semibold py-1 px-3 border-2 ${
                                                        isPriority
                                                            ? "bg-[#DCFCE7] text-[#15803D] border-green-600"
                                                            : "bg-[#F8FAFC] text-[#475569] border-blue-800"
                                                    } rounded-full`}
                                                >
                                                    {reco.label === "Priority" ? "Required" : "Recommended"}
                                                </div>
                                            </div>

                                            <div className="w-full">
                                                {/* LEARN */}
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                                            <FaBookOpen size={16} className="text-blue-600" />
                                                        </div>
                                                        <div className="w-px flex-1 bg-gray-200 my-1"></div>
                                                    </div>
                                                    <div className="pb-4">
                                                        <h3 className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-1">Learn</h3>
                                                        <p className="text-[14px] text-gray-800">{reco.learn}</p>
                                                    </div>
                                                </div>

                                                {/* PRACTICE */}
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                                                            <ImWrench size={16} className="text-amber-600" />
                                                        </div>
                                                        <div className="w-px flex-1 bg-gray-200 my-1"></div>
                                                    </div>
                                                    <div className="pb-4">
                                                        <h3 className="text-amber-600 font-semibold text-sm uppercase tracking-wide mb-1">Practice</h3>
                                                        <p className="text-[14px] text-gray-800">{reco.practice}</p>
                                                    </div>
                                                </div>

                                                {/* SHOWCASE (last item, no connector line) */}
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                            <BsAwardFill size={16} className="text-green-600" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-green-600 font-semibold text-sm uppercase tracking-wide mb-1">Showcase</h3>
                                                        <p className="text-[14px] text-gray-800">{reco.proof}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    );
                                })
                            }                            
                        </div>
                    </div>

                </div>
            </div>

        </div>
    )
}