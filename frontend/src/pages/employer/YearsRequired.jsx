import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import ConfirmationBox from "../../components/popUps/ConfirmationBox"
import Loading from "../../components/others/Loading";
import Translucent from "../../components/overlay/Translucent"
import { BiLoaderAlt } from "react-icons/bi";
import { FaArrowLeftLong } from "react-icons/fa6";
import { jobCreationStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function YearsRequired({ mode = "create" }) {
    const { jobID } = useParams();
    const isEditMode = mode === "edit";

    const { createdJob, setCreatedJob, clearCreatedJob } = jobCreationStore();
    const { currentUser } = userStore();
    const navigate = useNavigate();

    const [yearsRequired, setYearsRequired] = useState("");
    const [isJobPosted, setIsJobPosted] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitError, setSubmitError] = useState("");
    
    const experienceOptions = [
        { label: "No experience", value: "0" },
        { label: "Less than a year", value: "0.5" },
        { label: "1 year", value: "1" },
        { label: "2 years", value: "2" },
        { label: "3 years", value: "3" },
        { label: "4 years", value: "4" },
        { label: "5 years", value: "5" },
        { label: "More than 5 years", value: "6" },
    ];

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

                setVerified(true);
            } catch (error) {
                // console.log(error);
                setVerified(false);
                navigate("/forbidden");
            } finally {
                setLoading(false);
            }
        }

        checkEmployer();
    }, [currentUser]);

    function hidePopUp() {
        setIsJobPosted(false);
        // clearCreatedJob();
        navigate("/employer/jobs");
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!createdJob.jobTitle ||
            !createdJob.location ||
            !createdJob.workplaceOption ||
            !createdJob.workType ||
            !createdJob.payRangeFrom ||
            !createdJob.payRangeTo ||
            !createdJob.jobOverview ||
            !createdJob.jobDuties ||
            !createdJob.requiredQualifications ||
            !createdJob.yearsRequired
        ) {
            setSubmitError("Please fill out all required fields before posting");
            return
        }

        setIsPosting(true);

        try {
            if (isEditMode) {
                await axios.put(`/api/employer/updateJob/${jobID}`, createdJob, {
                    withCredentials: true
                });
            } else {
                await axios.post("/api/employer/postJob", createdJob, {
                    withCredentials: true
                });
            }

            setIsJobPosted(true);
            setSubmitError("")
        } catch (error) {
            setSubmitError(
                isEditMode ? "Updating job failed. Please try again"
                : "Posting job failed. Please try again")
        } finally {
            setIsPosting(false);
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
                
                {isJobPosted && 
                    <>
                        <Translucent />
                        <ConfirmationBox 
                            onClick={hidePopUp} 
                            text={isEditMode ? "Job updated successfully" : "Job posted successfully"}
                            buttonText="View Job"
                        />
                    </>
                }

                <h1 className="text-2xl font-bold my-6 text-center">Post Your Job Ad</h1>

                <form onSubmit={handleSubmit} className="w-full rounded-2xl bg-white p-6 shadow-md mb-7">
                    <h2 className="font-semibold text-md mb-5">What is the minimum years of experience do you require?</h2>


                    <div className="flex flex-col gap-4 mb-5">
                        {experienceOptions.map((option) => (
                            <label
                                key={option.value}
                                className="flex items-center gap-4 text-md cursor-pointer"
                            >
                            <input
                                type="radio"
                                name="yearsRequired"
                                value={option.value}
                                checked={createdJob.yearsRequired === option.value}
                                onChange={(e) =>
                                    setCreatedJob({yearsRequired: e.target.value})
                                }
                            />

                            <span>{option.label}</span>
                            </label>
                        ))}
                    </div>

                    {submitError && <p className="text-sm text-red-600">*{submitError}</p>}

                    <div className="flex justify-between w-full">
                        <PrimaryButton disabled={isPosting} to="/employer/createJob/description" className={`bg-white text-black! border-2 border-gray-400 ${isPosting && "opacity-50"}`}><span className="flex items-center justify-center gap-2"><FaArrowLeftLong />Back</span></PrimaryButton>
                        <PrimaryButton disabled={isPosting} className={`${isPosting && "opacity-50"}`} type="submit" className="px-8">
                            {isPosting ? (
                                <>
                                    <BiLoaderAlt className="animation-spin mr-3 inline" />
                                    {isEditMode ? "Saving" : "Posting"}
                                </>
                            ) : (
                                isEditMode ? "Save Changes" : "Post"
                            )}
                        </PrimaryButton>
                    </div>
                </form>

            </div>

            <Footer />
        </>
    )
}