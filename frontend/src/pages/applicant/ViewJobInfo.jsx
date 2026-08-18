import AuthNavBar from "../../components/navBars/AuthNavBar";
import ApplicantSideBar from "../../components/navBars/ApplicantSideBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton"
import defaultPhoto from "../../assets/defaultCover.jpg"
import { LuBriefcase } from "react-icons/lu";
import { MdOutlineLocationOn } from "react-icons/md";
import { PiMoneyWavy } from "react-icons/pi";
import { FaRegBookmark } from "react-icons/fa";
import { FaRegBuilding } from "react-icons/fa6";
import { AiOutlineLaptop } from "react-icons/ai";
import { TbBuildingCommunity } from "react-icons/tb";
import { userStore } from "../../zustand/userState";
import { locationStore, jobInfoStore, sideBarStore } from "../../zustand/stateHandlers";
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import api from "../../apis/axios";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";


export default function ViewJobInfo() {
    const navigate = useNavigate();
    const { jobID } = useParams();

    const { currentUser } = userStore();
    const { isJobSaved, setIsJobSaved } = jobInfoStore();
    const { setPrevLocation } = locationStore();
    const { sideBarStatus } = sideBarStore();
    useLockBodyScroll(sideBarStatus);    

    const location = useLocation();

    const [selectedJob, setSelectedJob] = useState({});

    const [savedJobIDs, setSavedJobIDs] = useState(new Set());


    useEffect(() => {
        async function getJob() {
            try {
                const jobDesc = await api.get(`/applicant/viewJob/${jobID}`)

                setSelectedJob(jobDesc.data);
                // console.log(jobDesc.data)
            } catch (error) {
                console.log(error)
            }
        }

        getJob()
    }, [])

    useEffect(() => {
        async function fetchSavedJobs() {
            const res = await api.get("/applicant/getSavedJobs");
            // console.log(res.data.jobIDs)
            setSavedJobIDs(new Set(res.data.jobIDs));
        }

        fetchSavedJobs();
    }, [isJobSaved])

    function goNext(jobID) {
        setPrevLocation(location.pathname);
        navigate(`/applicant/viewJob/${jobID}/apply`);
    }

    function goAnalysis(jobID) {
        setPrevLocation(location.pathname);
        navigate(`/applicant/viewJob/${jobID}/chooseFile`);
    }
    

    async function saveJob(jobID) {
        try {
            await api.post("/applicant/saveJob", { jobID })

            setIsJobSaved(!isJobSaved);
        } catch (error) {
            console.log(error);
        }
    }

    async function unsaveJob(jobID) {
        try {
            await api.delete("/applicant/unsaveJob", {
                params: {jobID}
            })

            setIsJobSaved(!isJobSaved);
        } catch (error) {
            console.log(error);
        }
    }


    return (
        <div className="lg:flex relative w-full">
            <ApplicantSideBar />
            <SideBarOverlay />

            <div className="w-full min-h-full bg-[#F3F4F6] relative">
                <AuthNavBar />

                <div className="w-full p-6 md:p-15">

                    <div className=" w-full m-auto bg-white shadow-md  rounded-2xl md:w-120">
                        <div className="w-full rounded-tl-2xl rounded-tr-2xl ">
                            <img 
                                src={selectedJob.coverPhotoURL ? selectedJob.coverPhotoURL : defaultPhoto} 
                                alt="cover photo"
                                className="w-full h-40 object-cover rounded-tl-2xl rounded-tr-2xl md:h-55"
                            />
                        </div>

                        <div className="p-3 m:p-4 w-full mb-3 md:p-7">
                            <div className="w-full relative mb-6">
                                <img 
                                    src={selectedJob.profilePhotoURL ? selectedJob.profilePhotoURL : defaultPhoto} 
                                    alt="profile photo"
                                    className="w-25 m:w-27 object-cover rounded-lg md:rounded-xl md:w-30"
                                />
                                <PrimaryButton onClick={() => goAnalysis(jobID)} className="absolute top-0 right-0 rounded-md bg-gray-800! text-[10px] m:text-[12px]! md:text-sm">View Skill Gap Analysis</PrimaryButton>
                            </div>
                            <div className="w-full mb-4">
                                <h1 className="text-xl font-bold">{selectedJob.jobTitle}</h1>
                                <p className="text-gray-500 font-medium mb-6">{selectedJob.companyName}</p>
                                <div className="relative w-full mb-2">
                                    <MdOutlineLocationOn className="absolute top-1/2 -translate-y-1/2" />
                                    <span className="pl-7 text-sm md:text-[16px]">{selectedJob.location}</span>
                                </div>
                                <div className="relative w-full mb-2">
                                    <LuBriefcase className="absolute top-1/2 -translate-y-1/2" />
                                    <span className="pl-7 text-sm md:text-[1rem]">{selectedJob.workType}</span>
                                </div>
                                <div className="relative w-full mb-2">
                                    {selectedJob.workPlaceOption === "On-site" ? <FaRegBuilding className="absolute top-1/2 -translate-y-1/2"/> 
                                    : selectedJob.workPlaceOption === "Remote" ? <AiOutlineLaptop className="absolute top-1/2 -translate-y-1/2" />
                                    : <TbBuildingCommunity className="absolute top-1/2 -translate-y-1/2" />                                
                                    }
                                    <span className="pl-7 text-sm md:text-[1rem]">{selectedJob.workPlaceOption}</span>
                                </div>
                                <div className="relative w-full mb-5">
                                    <PiMoneyWavy className="absolute top-1/2 -translate-y-1/2" />
                                    <span className="pl-7 text-sm md:text-[1rem]">{`${selectedJob?.minSalary?.toLocaleString()} - ${selectedJob?.maxSalary?.toLocaleString()} per month`}</span>
                                </div>
                            </div>
                            <div>
                                <PrimaryButton onClick={() => goNext(jobID)} className="w-full mb-2">Apply Now</PrimaryButton>
                                {
                                    savedJobIDs.has(selectedJob.jobID) ?
                                        <SecondaryButton onclick={() => unsaveJob(selectedJob.jobID)} className="w-full py-2 font-bold! border-none bg-green-100">Saved</SecondaryButton>
                                    :
                                        <SecondaryButton onclick={() => saveJob(selectedJob.jobID)} className="w-full py-2 font-bold!">Save</SecondaryButton>
                                }

                            
                                
                            </div>
                        </div>

                        <div className="w-full px-4 pb-4 md:p-7">
                            <h1 className="text-xl font-bold text-center mb-2">Job Description</h1>
                            <p className="text-justify indent-8 text-[15px] mb-3">{selectedJob.jobOverview}</p>

                            <h2 className="font-bold mt-5 text-xl">Job Responsibilities</h2>
                            <div
                                className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                dangerouslySetInnerHTML={{
                                    __html: selectedJob.jobDuties?.replace(/&nbsp;/g, ' ')
                                }}
                            />

                            <h2 className="font-bold mt-5 text-xl">Required Qualifications</h2>
                            <div
                                className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                dangerouslySetInnerHTML={{
                                    __html: selectedJob.requiredQualifications?.replace(/&nbsp;/g, ' ')
                                }}
                            />

                            {selectedJob.preferredQualifications &&
                                <>
                                    <h2 className="font-bold mt-5 text-xl">Preferred Qualifications</h2>
                                    <div
                                        className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                        dangerouslySetInnerHTML={{
                                            __html: selectedJob.preferredQualifications?.replace(/&nbsp;/g, ' ')
                                        }}
                                    />                                
                                </>                           
                            }

                            {selectedJob.workingConditions &&
                                <>
                                    <h2 className="font-bold mt-5 text-xl">Working Conditions</h2>
                                    <div
                                        className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                        dangerouslySetInnerHTML={{
                                            __html: selectedJob.workingConditions?.replace(/&nbsp;/g, ' ')
                                        }}
                                    />                                
                                </>                           
                            }

                            {selectedJob.jobBenefits &&
                                <>
                                    <h2 className="font-bold mt-5 text-xl">Job Benefits</h2>
                                    <div
                                        className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                        dangerouslySetInnerHTML={{
                                            __html: selectedJob.jobBenefits?.replace(/&nbsp;/g, ' ')
                                        }}
                                    />                                
                                </>                           
                            }
                        </div>
                    </div>


                </div>

            </div>

        </div>
    )
}