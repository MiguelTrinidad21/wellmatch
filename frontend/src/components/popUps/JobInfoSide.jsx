import Translucent from "../overlay/Translucent"
import { IoClose } from "react-icons/io5";
import { jobInfoStore } from "../../zustand/stateHandlers";
import { locationStore } from "../../zustand/stateHandlers";
import defaultPhoto from "../../assets/defaultCover.jpg"
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton"
import { LuBriefcase } from "react-icons/lu";
import { MdOutlineLocationOn } from "react-icons/md";
import { PiMoneyWavy } from "react-icons/pi";
import { FaRegBookmark } from "react-icons/fa";
import { FaRegBuilding } from "react-icons/fa6";
import { AiOutlineLaptop } from "react-icons/ai";
import { TbBuildingCommunity } from "react-icons/tb"
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function JobInfoSide({ display }) {
    const navigate = useNavigate();
    const previousLocation = useLocation();

    const { setDisplayJob, jobInfo, savedJobIDs, setSavedJobIDs, isJobSaved, setIsJobSaved } = jobInfoStore();
    const { setPrevLocation } = locationStore();
    const {
        jobID,
        coverPhotoURL,
        profilePhotoURL,
        jobTitle,
        companyName,
        location,
        workType,
        workPlaceOption,
        minSalary,
        maxSalary,
        jobOverview,
        jobDuties,
        requiredQualifications,
        preferredQualifications,
        workingConditions,
        jobBenefits    

    } = jobInfo;

    function goNext(jobID) {
        setPrevLocation(previousLocation.pathname);
        navigate(`/applicant/viewJob/${jobID}/apply`);
        setDisplayJob();
    }

    function goToAnalysis(jobID) {
        setPrevLocation(previousLocation.pathname);
        navigate(`/applicant/viewJob/${jobID}/chooseFile`);
        setDisplayJob();
    }

    async function saveJob(jobID) {
        try {
            await axios.post("/api/applicant/saveJob", { jobID }, {
                withCredentials: true
            })

            setIsJobSaved(!isJobSaved);
        } catch (error) {
            console.log(error);
        }
    }

    async function unsaveJob(jobID) {
        try {
            await axios.delete("/api/applicant/unsaveJob", {
                params: {jobID},
                withCredentials: true
            })

            setIsJobSaved(!isJobSaved);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        async function fetchSavedJobs() {
            const res = await axios.get("/api/applicant/getSavedJobs", {
                withCredentials: true
            });

            setSavedJobIDs(new Set(res.data.jobIDs));
        }

        fetchSavedJobs();
    }, [isJobSaved])
    
    return (
        <>
            <div onClick={setDisplayJob} className={`hidden lg:block fixed inset-0 z-30 bg-gray-800/50 transition-opacity duration-300 ${display ? "opacity-100 visible" : "opacity-0 invisible"}`}></div>
            <div className={`p-6 overflow-y-scroll hidden lg:block fixed z-40 top-0 right-0 bg-white w-[50%] xl:w-[40%] h-screen ${display ? "translate-x-0" : "translate-x-full"} transition-transform duration-300`}>
                <div className="relative w-full">
                    <button onClick={setDisplayJob} className="cursor-pointer p-2 rounded-full bg-green-100 absolute top-0 right-0"><IoClose size={20}/></button>
                </div>

                <div className="p-4 w-full mt-10 md:p-7">
                    <div className="w-full relative mb-4">
                        <img 
                            src={profilePhotoURL ? profilePhotoURL : defaultPhoto} 
                            alt="profile photo"
                            className="w-25 object-cover rounded-sm md:rounded-xl md:w-30"
                        />
                        <PrimaryButton onClick={() => goToAnalysis(jobID)} className="absolute top-0 font-bold! px-5 right-0 rounded-md bg-green-300! hover:bg-green-400 transition-colors duration-200 ease-in text-gray-800! text-sm">View Skill Gap Analysis</PrimaryButton>
                    </div>
                    <div className="w-full mb-4">
                        <h1 className="text-xl font-bold">{jobTitle}</h1>
                        <p className="text-gray-500 mb-6">{companyName}</p>
                        <div className="relative w-full mb-2">
                            <MdOutlineLocationOn className="absolute top-1/2 -translate-y-1/2" />
                            <span className="pl-7 text-sm md:text-[16px]">{location}</span>
                        </div>
                        <div className="relative w-full mb-2">
                            <LuBriefcase className="absolute top-1/2 -translate-y-1/2" />
                            <span className="pl-7 text-sm md:text-[1rem]">{workType}</span>
                        </div>
                        <div className="relative w-full mb-2">
                            {workPlaceOption === "On-site" ? <FaRegBuilding className="absolute top-1/2 -translate-y-1/2"/> 
                            : workPlaceOption === "Remote" ? <AiOutlineLaptop className="absolute top-1/2 -translate-y-1/2" />
                            : <TbBuildingCommunity className="absolute top-1/2 -translate-y-1/2" />                                
                            }
                            <span className="pl-7 text-sm md:text-[1rem]">{workPlaceOption}</span>
                        </div>
                        <div className="relative w-full mb-5">
                            <PiMoneyWavy className="absolute top-1/2 -translate-y-1/2" />
                            <span className="pl-7 text-sm md:text-[1rem]">{minSalary?.toLocaleString()} - {maxSalary?.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <PrimaryButton onClick={() => goNext(jobID)} className="w-full">Apply Now</PrimaryButton>
                        {
                            savedJobIDs.has(jobID) ?
                                <SecondaryButton onclick={() => unsaveJob(jobID)} className="w-full py-2 font-bold! border-none bg-green-100">Saved</SecondaryButton>
                            :
                                <SecondaryButton onclick={() => saveJob(jobID)} className="w-full py-2 font-bold!">Save</SecondaryButton>
                        }

                    
                        
                    </div>
                </div>

                <div className="w-full px-4 pb-4 md:p-7">
                    <h1 className="text-lg font-bold text-center mb-2">Job Desciption</h1>
                    <p className="text-justify indent-8 text-[15px] mb-3">{jobOverview}</p>

                    <h2 className="font-bold">Job Responsibilities</h2>
                    <div
                        className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                        dangerouslySetInnerHTML={{
                            __html: jobDuties?.replace(/&nbsp;/g, ' ')
                        }}
                    />

                    <h2 className="font-bold">Required Qualifications</h2>
                    <div
                        className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                        dangerouslySetInnerHTML={{
                            __html: requiredQualifications?.replace(/&nbsp;/g, ' ')
                        }}
                    />

                    {preferredQualifications &&
                        <>
                            <h2 className="font-bold">Preferred Qualifications</h2>
                            <div
                                className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                dangerouslySetInnerHTML={{
                                    __html: preferredQualifications?.replace(/&nbsp;/g, ' ')
                                }}
                            />                                
                        </>                           
                    }

                    {workingConditions &&
                        <>
                            <h2 className="font-bold">Working Conditions</h2>
                            <div
                                className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                dangerouslySetInnerHTML={{
                                    __html: workingConditions?.replace(/&nbsp;/g, ' ')
                                }}
                            />                                
                        </>                           
                    }

                    {jobBenefits &&
                        <>
                            <h2 className="font-bold">Job Benefits</h2>
                            <div
                                className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                dangerouslySetInnerHTML={{
                                    __html: jobBenefits?.replace(/&nbsp;/g, ' ')
                                }}
                            />                                
                        </>                           
                    }
                </div>                
            </div>
        </>
    )
}