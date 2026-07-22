import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import EmployerSideBar from "../../components/navBars/EmployerSideBar";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Tooltip from "../../components/others/Tooltip";
import Loading from "../../components/others/Loading";
import { FaArrowLeftLong } from "react-icons/fa6";
import { jobCreationStore } from "../../zustand/stateHandlers";
import { useNavigate, useParams } from "react-router-dom";
import TextEditor from "../../components/others/TextEditor"
import { useState, useEffect, useRef } from "react";
import { userStore } from "../../zustand/userState";
import { tooltipStore } from "../../zustand/stateHandlers";
import axios from "axios";

export default function JobDescription({ mode = "create" }) {
    const tooltipRef = useRef(null);
    const { jobID } = useParams();
    const isEditMode = mode === "edit";

    const { createdJob, setCreatedJob } = jobCreationStore();
    const { currentUser } = userStore();
    const { setShowTip } = tooltipStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const [errors, setErrors] = useState({
        issue: "",
        message: ""
    })

    useEffect(() => {
        function closeTooltip(e) {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
                setShowTip(false);
            }
        }

        document.addEventListener("mousedown", closeTooltip);

        return () => document.removeEventListener("mousedown", closeTooltip)
    }, [])

    useEffect(() => {
        async function checkEmployer() {
            try {
                // console.log(currentUser);
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    setLoading(false);
                    return;
                }

                await axios.get("/api/employer/authorize", {
                    params: {
                        employerID: currentUser.employerID
                    }
                });
                // console.log(createdJob)
                setVerified(true);
            } catch (error) {
                console.log(error);
                setVerified(false);
                navigate("/forbidden");
            } finally {
                setLoading(false);
            }
        }

        checkEmployer();
    }, [currentUser]);

    function isQuillEmpty(html) {
        const text = new DOMParser()
            .parseFromString(html, "text/html")
            .body.textContent
            .trim();

        return text.length === 0;
    }

    function handleNext(e) {
        e.preventDefault();

        if (!createdJob.jobOverview.trim()) {
            setErrors({
                issue: "Job Overview",
                message: "Job Overview is required"
            })
            return
        }

        if (isQuillEmpty(createdJob.jobDuties)) {
            setErrors({
                issue: "Job Responsibilities",
                message: "Job responsibilities are required to be indicated"
            });
            return;
        }

        if (isQuillEmpty(createdJob.requiredQualifications)) {
            setErrors({
                issue: "Required Qualifications",
                message: "Required qualifications are required to be indicated"
            });
            return;
        }

        setErrors(null);

        if (isEditMode) {
            navigate(`/employer/jobs/${jobID}/edit/description/years`);
        } else {
            navigate("/employer/createJob/description/years");
        }
    }

    if (loading) {
        return <Loading />
    }

    return (
        <div className="lg:flex relative w-full">
            <SideBarOverlay />
            <EmployerSideBar />

            <div className="w-full min-h-screen bg-[#F3F4F6]">
                <AuthNavBar />

                <div className="w-full p-6 md:px-15 md:py-10 lg:px-20 xl:px-40">
                    <h1 className="text-2xl font-bold mb-6 lg:mb-2 text-center lg:text-3xl xl:text-4xl lg:text-left">{isEditMode ? "Update Job Post" : "Create Job Post"}</h1>
                    <p className="mb-5 hidden lg:block xl:text-xl font-medium text-gray-500">Step 2 of 3 &mdash; Describe job description and requirements.</p>


                    <div className="w-full md:w-100 lg:w-full mb-5 lg:mb-7 m-auto">
                        <div className="grid grid-cols-3 w-full gap-1 lg:gap-2 mb-2">
                            <div className="border-t-3 lg:border-t-4 border-gray-300 lg:pt-7">
                                <p className="hidden lg:block font-bold text-gray-500 text-left">Basic Details</p>
                            </div>
                            <div className="border-t-3 lg:border-t-4 border-green-600 lg:pt-7">
                                <p className="hidden lg:block font-bold text-green-700 text-center">Job Description</p>
                            </div>
                            <div className="border-t-3 lg:border-t-4 border-gray-300 lg:pt-7">
                                <p className="hidden lg:block font-bold text-gray-500 text-right">Years Required</p>
                            </div>
                        </div>
                        <p className="text-sm lg:hidden font-medium text-gray-500">Step 2 of 3 &mdash; <span className="text-green-600 font-semibold">Describe job description and requirements.</span></p>
                    </div>

                    <form onSubmit={handleNext} className="w-full rounded-2xl bg-white p-6 lg:py-10 lg:px-15 shadow-md m-auto md:w-100 lg:w-full lg:m-0">
                        <div className="w-full mb-6">
                            <div className="relative flex items-center w-max gap-2">
                                <label className="font-semibold text-lg mb-1" htmlFor="jobOverview">Job Overview</label>
                                <Tooltip ref={tooltipRef} textToCompare="Provide a brief overview of the role, its primary purpose, and how it contributes to the organization." text="Provide a brief overview of the role, its primary purpose, and how it contributes to the organization." />
                            </div>
                            <textarea 
                                className="p-2 lg:px-4 rounded-xl h-32 block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 placeholder:italic"
                                id="jobTitle"
                                value={createdJob.jobOverview}
                                onChange={(e) => setCreatedJob({jobOverview: e.target.value})}
                                required                             
                            />
                            {errors?.issue === "Job Overview" && 
                                <p className="text-sm text-red-600 italic">{errors.message}</p>
                            }
                        </div>

                        <div className="w-full mb-6">
                            <div className="relative flex items-center w-max gap-2">
                                <label className="block font-semibold text-lg mb-1" htmlFor="duties">Job Responsibilities</label>
                                <Tooltip ref={tooltipRef} textToCompare="List the main duties and responsibilities of the position." text="List the main duties and responsibilities of the position." />
                            </div>
                            <TextEditor 
                                value={createdJob.jobDuties} 
                                func={(value) => setCreatedJob({jobDuties: value})} 
                            />
                            {errors?.issue === "Job Responsibilities" && 
                                <p className="text-sm text-red-600 italic">{errors.message}</p>
                            }
                        </div>

                        <div className="w-full mb-6">
                            <div className="relative flex items-center w-max gap-2">
                                <label className="block font-semibold text-lg mb-1" htmlFor="duties">Required Qualifications</label>
                                <Tooltip ref={tooltipRef} textToCompare="Specify the minimum qualifications necessary to perform the job successfully." text="Specify the minimum qualifications necessary to perform the job successfully." />
                            </div>
                            <TextEditor 
                                value={createdJob.requiredQualifications} 
                                func={(value) => setCreatedJob({ requiredQualifications: value })} 
                            />
                            {errors?.issue === "Required Qualifications" && 
                                <p className="text-sm text-red-600 italic">{errors.message}</p>
                            }
                        </div>

                        <div className="w-full mb-6">
                            <div className="relative flex items-center w-max gap-2">
                                <label className="block font-semibold text-lg mb-1" htmlFor="duties">Preferred Qualifications</label>
                                <Tooltip ref={tooltipRef} textToCompare="List additional qualifications, skills, certifications, or experiences that are desirable but not required. (Optional)" text="List additional qualifications, skills, certifications, or experiences that are desirable but not required. (Optional)" />
                            </div>
                            <TextEditor 
                                value={createdJob.preferredQualifications} 
                                func={(value) => setCreatedJob({
                                    preferredQualifications: value
                                })} 
                            />
                        </div>

                        <div className="w-full mb-6">
                            <div className="relative flex items-center w-max gap-2">
                                <label className="block font-semibold text-lg mb-1" htmlFor="duties">Working Conditions</label>
                                <Tooltip ref={tooltipRef} textToCompare="Describe the work setup, schedule, location, and any special working conditions associated with the role. (Optional)" text="Describe the work setup, schedule, location, and any special working conditions associated with the role. (Optional)" />
                            </div>
                            <TextEditor 
                                value={createdJob.workingConditions} 
                                func={(value) => setCreatedJob({
                                    workingConditions: value
                                })} 
                            />
                        </div>

                        <div className="w-full mb-6">
                            <div className="relative flex items-center w-max gap-2">
                                <label className="block font-semibold text-lg mb-1" htmlFor="duties">Job Benefits</label>
                                <Tooltip ref={tooltipRef} textToCompare="Provide information about the compensation package, employee benefits, and other perks offered for the position. (Optional)" text="Provide information about the compensation package, employee benefits, and other perks offered for the position. (Optional)" />
                            </div>
                            <TextEditor 
                                value={createdJob.jobBenefits} 
                                func={(value) => setCreatedJob({
                                    jobBenefits: value
                                })} 
                            />
                        </div>

                        {errors?.issue !== "" && <p className="text-center text-red-600 italic text-sm mb-5">Please fill out {errors?.issue} section before proceeding</p>}

                        <div className="flex justify-between w-full">
                            <PrimaryButton
                                to={isEditMode ? `/employer/jobs/${jobID}/edit` : "/employer/createJob"}
                                className="bg-white text-black! border-2 border-gray-400"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <FaArrowLeftLong />Back
                                </span>
                            </PrimaryButton>
                            <PrimaryButton type="submit" className="px-8">Next</PrimaryButton>
                        </div>
                        
                    </form>
                </div>

            </div>
        
        </div>
    )
}

