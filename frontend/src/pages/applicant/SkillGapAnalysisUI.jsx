import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer"
import Loading from "../../components/others/Loading"
import MatchScore from "../../components/others/MatchScore";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import JobSkillEvidence from "../../components/popUps/JobSkillEvidence";
import ResumeViewerModal from "../../components/others/ResumeViewerModal";
import Translucent from "../../components/overlay/Translucent";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import { resumeStore } from "../../zustand/skillGapResume";
import defaultCover from "../../assets/defaultCover.jpg"
import { MdOutlineEmail } from "react-icons/md";
import { SlLocationPin } from "react-icons/sl";
import { IoIosCheckmark } from "react-icons/io";
import { IoMdClose } from "react-icons/io";
import { GoInfo } from "react-icons/go";
import axios from "axios";


export default function SkillGapAnalysisUI() {   
    
    const navigate = useNavigate();
    
    const { resumeToAnalyze, selectedOption } = resumeStore();
    const { currentUser } = userStore();
    const { jobID } = useParams();
    
    const [verified, setVerified] = useState(false);

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
        if (!loading && !verified) {
            navigate("/forbidden");
        }
    }, [loading, verified, navigate]);

    useEffect(() => {

        async function getSkillGapReport() {
            console.log(resumeToAnalyze)

            try {

                const skillGapReport = await axios.post(
                    `/api/applicant/${jobID}/resumeSelected/skillgap`,
                    resumeToAnalyze,
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
        return <Loading />
    }

    if (!verified) {
        return null;
    }

    if (!selectedJob || !skillGapAnalysis) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#F3F4F6]">
                <p className="text-gray-500 text-sm">Something went wrong. Please refresh and try again.</p>
            </div>
        );
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
                        resumeID={resumeToAnalyze.resumeID}
                        onClose={() => setShowResumeViewer(false)}
                        />
                    </>
                }

                <div className="w-full min-h-[calc(100vh-64px)] p-6">
                    <div className="w-full grid grid-cols-1 gap-4">

                        <div className="w-full flex flex-col gap-4">
                            <section className="rounded-2xl shadow-md bg-white p-4">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-19">
                                        <img className="w-full h-full rounded-full object-cover" src={`${currentUser.profilePhoto ? currentUser.profilePhoto : defaultCover}`} alt="" />
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-lg font-bold">{`${currentUser.firstName} ${currentUser.lastName}`}</h1>
                                        <div className="relative w-full">
                                            <MdOutlineEmail className="absolute top-1/2 -translate-y-1/2 left-0" />
                                            <p className="pl-6">{currentUser.email}</p>
                                        </div>
                                        <div className="relative w-full">
                                            <SlLocationPin className="absolute top-1/2 -translate-y-1/2 left-0" />
                                            <p className="pl-6">{currentUser.address}</p>
                                        </div>
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

                            <section className="rounded-2xl shadow-md bg-white p-4 w-full max-h-90 overflow-y-auto">
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

                        <div className="w-full flex flex-col gap-4">
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

                                    <h2 className="text-[12px] font-bold mb-1 text-green-700">REQUIRED SKILLS</h2>
                                    <div className="w-full flex flex-col gap-1 mb-4 ">
                                        {skillGapAnalysis.matchedSkills
                                            ?.filter((skill) => skill.skillType === "core")
                                            .map((skill, index) => (
                                                <div
                                                    className="relative bg-[#F0FDF4] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.98] transition-transform duration-200 ease-in"
                                                    key={`matched-core-${index}`} 
                                                    onClick={() =>
                                                        setActiveMatchEvidenceIndex(
                                                             activeMatchEvidenceIndex === `matched-core-${index}` ? null : `matched-core-${index}`
                                                        )
                                                    }
                                                >
                                                    { activeMatchEvidenceIndex === `matched-core-${index}` &&
                                                        <JobSkillEvidence
                                                            status="matched"
                                                            resumeSkill={skill.matchedResumeSkill}
                                                            resumeEvidence={skill.resumeEvidence}
                                                            jobSkill={skill.matchedJobSkill}
                                                            jobEvidence={skill.jobEvidence}
                                                            toggleFunc={() => setActiveMatchEvidenceIndex(null)} 
                                                        />                                                   
                                                    }
                                                    <div className="flex justify-center items-center w-5 h-5 rounded-full bg-green-600 ">
                                                        <IoIosCheckmark className="text-white" size={50} />
                                                    </div>
                                                    <p className="flex-1 font-bold text-[#4A9E69]">{skill.matchedJobSkill}</p>
                                                </div>
                                            ))
                                        }
                                    </div>

                                    {selectedJob.preferredQualifications && 
                                        <>
                                            <h2 className="text-[12px] font-bold mb-1 text-green-700">PREFERRED SKILLS</h2>
                                            <div className="w-full flex flex-col gap-1 mb-4 ">
                                                {skillGapAnalysis.matchedSkills
                                                    ?.filter((skill) => skill.skillType === "secondary")
                                                    .map((skill, index) => (
                                                        <div 
                                                            key={`matched-second-${index}`}
                                                            className="relative bg-[#F0FDF4] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.98] transition-transform duration-200 ease-in"
                                                            onClick={() =>
                                                                setActiveMatchEvidenceIndex(
                                                                     activeMatchEvidenceIndex === `matched-second-${index}` ? null : `matched-second-${index}`
                                                                )
                                                            }
                                                        >
                                                            { activeMatchEvidenceIndex === `matched-second-${index}` &&
                                                                <JobSkillEvidence
                                                                    status="matched"
                                                                    resumeSkill={skill.matchedResumeSkill}
                                                                    resumeEvidence={skill.resumeEvidence}
                                                                    jobSkill={skill.matchedJobSkill}
                                                                    jobEvidence={skill.jobEvidence}
                                                                    toggleFunc={() => setActiveMatchEvidenceIndex(null)} 
                                                                />                                                   
                                                            }

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
                                </div>

                                <div className="p-4 rounded-2xl shadow-md bg-white border-l-4 border-l-red-600">
                                    <div className="flex gap-2 items-center mb-2">
                                        <div className="w-3 h-3 bg-red-600 inline-block rounded-full"></div>
                                        <h1 className="font-bold text-lg">Skill Gaps</h1>
                                    </div>

                                    <h2 className="text-[12px] font-bold mb-1 text-red-600">CORE GAPS - HIGH PRIORITY</h2>
                                    <div className=" w-full flex flex-col gap-1 mb-4 ">
                                        {skillGapAnalysis.missingSkills
                                            ?.filter((skill) => skill.skillType === "core")
                                            ?.map((skill, index) => (
                                                <div 
                                                    key={`missing-core-${index}`} 
                                                    className="relative bg-[#FFF1F2] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.98] transition-transform duration-200 ease-in"
                                                    onClick={() =>
                                                        setActiveMissingEvidenceIndex(
                                                             activeMissingEvidenceIndex === `missing-core-${index}` ? null : `missing-core-${index}`
                                                        )
                                                    }
                                                >
                                                    {activeMissingEvidenceIndex === `missing-core-${index}` &&
                                                        <JobSkillEvidence
                                                            status="missing"
                                                            jobSkill={skill.parentSkill}
                                                            jobEvidence={skill.jobEvidence}
                                                            toggleFunc={() => setActiveMissingEvidenceIndex(null)} 
                                                        />                                                   
                                                    }
                                                    <div className="flex justify-center items-center w-5 h-5 rounded-full bg-red-600 ">
                                                        <IoMdClose className="text-white" />
                                                    </div>
                                                    <p className="flex-1 font-bold text-[#BE123C]">{skill.parentSkill}</p>
                                                </div>
                                                )
                                            )
                                        }
                                    </div>

                                    {selectedJob.preferredQualifications && 
                                        <>
                                            <h2 className="text-[12px] font-bold mb-1 text-[#92400E]">SECONDARY - OPTIONAL</h2>
                                            <div className="w-full flex flex-col gap-1 mb-4 ">
                                                {skillGapAnalysis.missingSkills
                                                    ?.filter((skill) => skill.skillType === "secondary")
                                                    ?.map((skill, index) => (
                                                        <div 
                                                            key={`missing-second-${index}`} 
                                                            className="relative bg-[#FFFBEB] p-2 pl-4 rounded-md flex items-center gap-2 active:scale-[0.97] transition-transform duration-200 ease-in"
                                                            onClick={() =>
                                                                setActiveMissingEvidenceIndex(
                                                                    activeMissingEvidenceIndex === `missing-second-${index}` ? null : `missing-second-${index}`
                                                                )
                                                            }
                                                        >
                                                            {activeMissingEvidenceIndex === `missing-second-${index}` &&
                                                                <JobSkillEvidence
                                                                    status="missing"
                                                                    jobSkill={skill.parentSkill}
                                                                    jobEvidence={skill.jobEvidence}
                                                                    toggleFunc={() => setActiveMissingEvidenceIndex(null)} 
                                                                />                                                   
                                                            }

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
                                </div>


                            </section>

                            <section className="rounded-2xl shadow-md bg-white p-4 w-full">
                                <h1 className="text-lg font-bold mb-3">How Your Score Was Reached</h1>
                                <p className="text-sm text-justify mb-3 indent-5">{skillGapAnalysis.scoreExplanation}</p>

                                <div className="w-full flex items-center gap-3 bg-[#F0FDF4] rounded-md text-green-600 p-2">
                                    <GoInfo size={50} />
                                    <p className="text-[12px] font-semibold">To ensure fairness, this evaluation considers only information explicitly stated in the resume.</p>
                                </div>
                            </section>

                            <hr className="my-2 h-0.5 bg-[#BDBFC1] border-none" />

                            <h1 className="font-bold">UPSKILLING RECOMMENDATIONS</h1>
                            {
                                skillGapAnalysis.upskillingReco.map((reco, index) => (
                                    <section key={index} className="rounded-2xl shadow-md bg-white p-4 w-full">
                                        <div className="flex justify-between items-center mb-2 gap-3">
                                            <h2 className="font-semibold text-[15px]">{reco.skillGap}</h2>
                                            <div className={`text-[11px] font-medium py-1 px-3 border-2 ${reco.label === "Priority" ? "bg-[#FFF1F2] text-[#BE123C] border-[#BE123C]" : "bg-[#FFFBEB] text-[#92400E] border-[#92400E]"} rounded-full`}>{reco.label}</div>
                                        </div>

                                        <div className="w-full">
                                            <div></div>
                                            <div className="border-b-2 border-b-gray-300 py-2">
                                                <h3 className="text-green-600 font-bold text-[15px] mb-1">LEARN</h3>
                                                <p className="text-[13px] text-justify">{reco.learn}</p>
                                            </div>
                                            <div className="py-2">
                                                <h3 className="text-green-600 font-bold text-[15px] mb-1">PRACTICE</h3>
                                                <p className="text-[13px] text-justify">{reco.practice}</p>
                                            </div>
                                            <div className="border-t-2 border-t-gray-300 py-2">
                                                <h3 className="text-green-600 font-bold text-[15px] mb-1">SHOWCASE</h3>
                                                <p className="text-[13px] text-justify">{reco.proof}</p>
                                            </div>
                                        </div>
                                    </section>
                                ))
                            }
                        </div>
                    </div>

                </div>
            </div>

            <Footer />
        </>
    )
}