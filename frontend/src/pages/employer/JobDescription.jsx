import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Tooltip from "../../components/others/Tooltip";
import Loading from "../../components/others/Loading";
import { FaArrowLeftLong } from "react-icons/fa6";
import { jobCreationStore } from "../../zustand/stateHandlers";
import { useNavigate, useParams } from "react-router-dom";
import TextEditor from "../../components/others/TextEditor"
import { useState, useEffect } from "react";
import { userStore } from "../../zustand/userState";
import axios from "axios";

export default function JobDescription({ mode = "create" }) {
    const { jobID } = useParams();
    const isEditMode = mode === "edit";

    const { createdJob, setCreatedJob } = jobCreationStore();
    const { currentUser } = userStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const [errors, setErrors] = useState({
        issue: "",
        message: ""
    })

    useEffect(() => {
        async function checkEmployer() {
            try {
                console.log(currentUser);
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
                console.log(createdJob)
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
        <>
            <div className="w-full px-6 min-h-screen bg-[#F9FAFB]">
                <AuthNavBar />
                <Overlay />

                <h1 className="text-2xl font-bold my-6 text-center">Write your job description</h1>

                <form onSubmit={handleNext} className="w-full rounded-2xl bg-white p-6 shadow-md mb-7">
                    <div className="w-full mb-6">
                        <div className="relative flex items-center w-max gap-2">
                            <label className="font-semibold text-lg mb-1" htmlFor="jobOverview">Job Overview</label>
                            <Tooltip  text="Provide a brief overview of the role, its primary purpose, and how it contributes to the organization." />
                        </div>
                        <textarea 
                            className="w-full text-md p-2 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl appearance-none h-32 placeholder:italic"
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
                            <Tooltip text="List the main duties and responsibilities of the position." />
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
                            <Tooltip text="Specify the minimum qualifications necessary to perform the job successfully." />
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
                            <Tooltip text="List additional qualifications, skills, certifications, or experiences that are desirable but not required. (Optional)" />
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
                            <Tooltip text="Describe the work setup, schedule, location, and any special working conditions associated with the role. (Optional)" />
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
                            <Tooltip text="Provide information about the compensation package, employee benefits, and other perks offered for the position. (Optional)" />
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
        
            <Footer />
        </>
    )
}

