import AuthNavBar from "../../components/navBars/AuthNavBar";
import ApplicantSideBar from "../../components/navBars/ApplicantSideBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import Loading from "../../components/others/Loading"
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
import { locationStore } from "../../zustand/stateHandlers";
import { jobInfoStore } from "../../zustand/stateHandlers";
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";


export default function ViewJobInfo() {
    const navigate = useNavigate();
    const { jobID } = useParams();
    const { currentUser } = userStore();
    const { isJobSaved, setIsJobSaved } = jobInfoStore();
    const { setPrevLocation } = locationStore();

    const location = useLocation();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState({});

    const [savedJobIDs, setSavedJobIDs] = useState(new Set());

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
                setLoading(false);
            }
        }

        getJob()
    }, [])

    useEffect(() => {
        async function fetchSavedJobs() {
            const res = await axios.get("/api/applicant/getSavedJobs", {
                withCredentials: true
            });
            console.log(res.data.jobIDs)
            setSavedJobIDs(new Set(res.data.jobIDs));
        }

        fetchSavedJobs();
    }, [isJobSaved])

    function goNext(jobID) {
        setPrevLocation(location.pathname);
        navigate(`/applicant/viewJob/${jobID}/apply`);
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

            <div className="w-full min-h-full bg-[#F3F4F6] relative">
                <AuthNavBar />

                <div className="w-full p-6 md:p-15">

                    <div className=" w-full m-auto bg-white shadow-md  rounded-2xl md:w-120">
                        <div className="w-full rounded-tl-2xl rounded-tr-2xl ">
                            <img 
                                src={selectedJob.coverPhotoURL ? selectedJob.coverPhotoURL : defaultPhoto} 
                                alt="cover photo"
                                className="w-full h-45 object-cover rounded-tl-2xl rounded-tr-2xl md:h-55"
                            />
                        </div>

                        <div className="p-4 w-full mb-3 md:p-7">
                            <div className="w-full relative mb-4">
                                <img 
                                    src={selectedJob.profilePhotoURL ? selectedJob.profilePhotoURL : defaultPhoto} 
                                    alt="profile photo"
                                    className="w-25 object-cover rounded-sm md:rounded-xl md:w-30"
                                />
                                <PrimaryButton to={`/applicant/viewJob/${jobID}/chooseFile`} className="absolute top-0 right-0 bg-[#2B2B2B]! text-[12px]">View Skill Gap Analysis</PrimaryButton>
                            </div>
                            <div className="w-full mb-4">
                                <h1 className="text-xl font-bold">{selectedJob.jobTitle}</h1>
                                <p className="text-gray-500 mb-6">{selectedJob.companyName}</p>
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
                                    <span className="pl-7 text-sm md:text-[1rem]">{selectedJob?.minSalary?.toLocaleString()} - {selectedJob?.maxSalary?.toLocaleString()}</span>
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
                            <h1 className="text-lg font-bold text-center mb-2">Job Desciption</h1>
                            <p className="text-justify indent-8 text-[15px] mb-3">{selectedJob.jobOverview}</p>

                            <h2 className="font-bold">Job Responsibilities</h2>
                            <div
                                className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                dangerouslySetInnerHTML={{
                                    __html: selectedJob.jobDuties?.replace(/&nbsp;/g, ' ')
                                }}
                            />

                            <h2 className="font-bold">Required Qualifications</h2>
                            <div
                                className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                dangerouslySetInnerHTML={{
                                    __html: selectedJob.requiredQualifications?.replace(/&nbsp;/g, ' ')
                                }}
                            />

                            {selectedJob.preferredQualifications &&
                                <>
                                    <h2 className="font-bold">Preferred Qualifications</h2>
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
                                    <h2 className="font-bold">Working Conditions</h2>
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
                                    <h2 className="font-bold">Job Benefits</h2>
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