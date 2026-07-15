import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import ApplicantSideBar from "../../components/navBars/ApplicantSideBar";
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import DeleteItemBox from "../../components/popUps/DeleteItemBox"
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import { FaBuilding } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { HiOutlineBookmarkSlash } from "react-icons/hi2";
import axios from "axios";

export default function SavedJobs() {
    const navigate = useNavigate();
    const { currentUser } = userStore();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isJobSaved, setIsJobSaved] = useState(false);
    const [savedJobs, setSavedJobs] = useState([]);

    const [showDelBox, setShowDelBox] = useState(false)
    const [jobToDelete, setJobToDelete] = useState(null);

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
        async function fetchSavedJobs() {
            const res = await axios.get("/api/applicant/getSavedJobs", {
                withCredentials: true
            });
            console.log(res.data.savedJobs)
            setSavedJobs(res.data.savedJobs);
        }

        fetchSavedJobs();
    }, [isJobSaved])
    

    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden");
        }
    }, [loading, verified, navigate]);

    async function unsaveJob(jobID) {
        try {
            await axios.delete("/api/applicant/unsaveJob", {
                params: {jobID},
                withCredentials: true
            })

            setIsJobSaved(!isJobSaved);
            setShowDelBox(false);
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

            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />

                {
                    showDelBox &&
                    <DeleteItemBox 
                        heading="Unsave job post"
                        bodyText="Are you sure you want to remove this?"
                        deleteFunction={() => unsaveJob(jobToDelete)}
                        toggleFunction={() => setShowDelBox(false)}
                        buttonText="Remove"
                    />
                }

                {
                    savedJobs.length > 0 ?
                        <div className="w-full p-6 md:p-15 lg:p-10 xl:px-30"    >
                            <div className="flex items-center justify-between mb-3 md:mb-5">
                                <h1 className="font-bold text-xl">Saved Jobs</h1>
                                <p className="text-gray-500 font-medium">{savedJobs.length} saved {savedJobs.length > 1 ? "jobs" : "job"}</p>
                            </div>

                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-6 items-stretch">
                        {savedJobs?.map((item) => (
                            <div key={item.savedJobID} className="bg-white w-full h-full flex flex-col rounded-2xl shadow-md lg:shadow-lg p-4 xl:p-7">
                                <h2 className="font-bold text-lg mb-2">{item.jobTitle}</h2>
                                <p>
                                    <span className="flex items-center gap-2 font-semibold text-sm xl:text-[1rem] text-gray-500">
                                        <FaBuilding />
                                        {item.companyName}    
                                    </span>
                                </p>
                                <p className="mb-5">
                                    <span className="flex items-center gap-2 font-semibold text-sm xl:text-[1rem] text-gray-500">
                                        <FaLocationDot />
                                        {item.location}    
                                    </span>
                                </p>

                                <p className="text-sm text-gray-500 line-clamp-3 mb-5">{item.jobOverview}</p>

                                <div className="w-full flex items-center justify-end gap-2 mt-auto">
                                    <PrimaryButton 
                                        onClick={() => {
                                            setJobToDelete(item.jobID)
                                            setShowDelBox(true)
                                        }} 
                                        className="bg-white text-red-600!">
                                        Remove
                                    </PrimaryButton>
                                    <PrimaryButton to={`/applicant/viewJob/${item.jobID}`} className="px-5">View Job</PrimaryButton>
                                </div>
                            </div>
                        ))}                       
                        </div>

                        </div>                       
                    :
                        <div className="w-full p-6 absolute top-1/2 -translate-y-1/2 flex flex-col gap-3 justify-center items-center">
                            <HiOutlineBookmarkSlash className="text-gray-700 xl:h-20 xl:w-20" size={50} />
                            <h1 className="text-lg font-bold xl:text-2xl">No saved jobs yet</h1>
                            <p className="text-gray-500 font-medium text-center text-sm xl:text-lg">Save jobs you're interested in to easily find them later.</p>
                        </div>
                }

        
            </div>

        </div>
    )
}