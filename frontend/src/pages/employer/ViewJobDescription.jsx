import AuthNavBar from "../../components/navBars/AuthNavBar";
import defaultPhoto from "../../assets/defaultCover.jpg"
import { LuBriefcase } from "react-icons/lu";
import { MdOutlineLocationOn } from "react-icons/md";
import { PiMoneyWavy } from "react-icons/pi";
import { FaRegBookmark } from "react-icons/fa";
import { FaRegBuilding } from "react-icons/fa6";
import { AiOutlineLaptop } from "react-icons/ai";
import { TbBuildingCommunity } from "react-icons/tb";
import { userStore } from "../../zustand/userState";
import { sideBarStore } from "../../zustand/stateHandlers";
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import api from "../../apis/axios";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";


export default function ViewJobDescription() {
    const navigate = useNavigate();
    const { jobID } = useParams();
    const { currentUser } = userStore();
    const { sideBarStatus } = sideBarStore();
    useLockBodyScroll(sideBarStatus);

    const [selectedJob, setSelectedJob] = useState({});


    useEffect(() => {
        async function getJob() {
            try {
                const jobDesc = await api.get(`/employer/viewJob/${jobID}`)

                setSelectedJob(jobDesc.data);
                // console.log(jobDesc.data)
            } catch (error) {
                console.log(error)
            }
        }

        getJob()
    }, [])


    return (
        <>
            <div className="w-full min-h-full bg-[#F3F4F6] relative">
                <AuthNavBar />

                <div className="w-full p-6 md:p-15">

                    <div className=" w-full bg-white shadow-md m-auto rounded-2xl md:w-120">
                        <div className="w-full rounded-tl-2xl rounded-tr-2xl ">
                            <img 
                                src={selectedJob.coverPhotoURL ? selectedJob.coverPhotoURL : defaultPhoto} 
                                alt="cover photo"
                                className="w-full h-40 object-cover rounded-tl-2xl rounded-tr-2xl md:h-55"
                            />
                        </div>

                        <div className="p-4 w-full mb-3 md:p-7">
                            <div className="w-full relative mb-4">
                                <img 
                                    src={selectedJob.profilePhotoURL ? selectedJob.profilePhotoURL : defaultPhoto} 
                                    alt="cover photo"
                                    className="w-25 object-cover rounded-md md:rounded-xl md:w-30"
                                />
                                
                            </div>
                            <div className="w-full">
                                <h1 className="text-xl font-bold">{selectedJob.jobTitle}</h1>
                                <p className="text-gray-500 mb-6 font-semibold">{selectedJob.companyName}</p>
                                <div className="relative w-full mb-2">
                                    <MdOutlineLocationOn className="absolute top-1/2 -translate-y-1/2" />
                                    <span className="pl-7 text-sm md:text-[16px]">{selectedJob.location}</span>
                                </div>
                                <div className="relative w-full mb-2">
                                    <LuBriefcase className="absolute top-1/2 -translate-y-1/2" />
                                    <span className="pl-7 text-sm md:text-[16px]">{selectedJob.workType}</span>
                                </div>
                                <div className="relative w-full mb-2">
                                    {selectedJob.workPlaceOption === "On-site" ? <FaRegBuilding className="absolute top-1/2 -translate-y-1/2"/> 
                                    : selectedJob.workPlaceOption === "Remote" ? <AiOutlineLaptop className="absolute top-1/2 -translate-y-1/2" />
                                    : <TbBuildingCommunity className="absolute top-1/2 -translate-y-1/2" />                                
                                    }
                                    <span className="pl-7 text-sm md:text-[16px]">{selectedJob.workPlaceOption}</span>
                                </div>
                                <div className="relative w-full">
                                    <PiMoneyWavy className="absolute top-1/2 -translate-y-1/2" />
                                    <span className="pl-7 text-sm md:text-[16px]">{`${selectedJob?.minSalary?.toLocaleString()} - ${selectedJob?.maxSalary?.toLocaleString()} per month`}</span>
                                </div>
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

        </>
    )
}