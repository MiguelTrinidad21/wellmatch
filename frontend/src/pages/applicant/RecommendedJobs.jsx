import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer"
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton"
import { LuBriefcase } from "react-icons/lu";
import { MdOutlineLocationOn } from "react-icons/md";
import { PiMoneyWavy } from "react-icons/pi";
import { FaRegBookmark } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { userStore } from "../../zustand/userState";
import { jobSearchStore } from "../../zustand/jobSearching";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ReactPaginateModule from "react-paginate";


export default function RecommendedJobs() {
    const ReactPaginate = ReactPaginateModule.default || ReactPaginateModule;

    const navigate = useNavigate();
    const { currentUser } = userStore();
    const { 
        jobSearchResults, 
        setJobSearchResults, 
        jobSearch, 
        setJobSearch
    } = jobSearchStore();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [resumeStatus, setResumeStatus] = useState("");
    const [isSearchingJob, setIsSearchingJob] = useState(false);

    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [isLocationSelected, setIsLocationSelected] = useState(false);
    const [lastSelectedLocation, setLastSelectedLocation] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalJobs, setTotalJobs] = useState(0);

    const jobsPerPage = 5;

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
        if (isLocationSelected && lastSelectedLocation === jobSearch.location) {
            return;
        } else {
            setIsLocationSelected(false);
        }

        const searchText = jobSearch.location.trim();

        if (searchText.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        const delay = setTimeout(async () => {
            try {
                setIsSearchingLocation(true);

                const response = await axios.get(
                    "/api/geoapify/autocomplete",
                    {
                        params: {
                            text: searchText.trim()
                        }
                    }
                );

                setLocationSuggestions(response.data.suggestions);
            } catch (error) {
                console.error(error.response?.data || error.message);
                setLocationSuggestions([]);
            } finally {
                setIsSearchingLocation(false);
            }
        }, 500);

        return () => clearTimeout(delay);
    }, [jobSearch.location, isLocationSelected]);

    function handleSelectLocation(place) {
        const formatted = [
            place.city,
            place.state
        ].filter(Boolean).join(", ");

        setJobSearch({
            ...jobSearch,
            location: formatted
        });

        setLastSelectedLocation(formatted);
        setIsLocationSelected(true);
        setLocationSuggestions([]);
    }

    function handlePageClick(event) {
        const selectedPage = event.selected + 1;
        fetchRecommendedJobs(selectedPage);
    }

    async function handleSubmit(e) {
        try {
            e.preventDefault();

            setIsSearchingJob(true);

            const jobResults = await axios.get("/api/applicant/searchJobs", {
                params: {
                    jobTitle: jobSearch.jobTitle,
                    location: jobSearch.location,
                    page: 1,
                    limit: jobsPerPage
                },
                withCredentials: true
            });
            console.log(jobResults.data)
            setJobSearchResults(jobResults.data || []);
            navigate("/applicant/searchJobs");
        } catch (error) {
            console.log(error)
        } finally {
            setIsSearchingJob(false);
        }
    }

    const fetchRecommendedJobs = useCallback(async (page = 1) => {
        try {
            const response = await axios.get("/api/applicant/recommendedJobs", {
                params:{
                    page,
                    limit: jobsPerPage
                },
                withCredentials: true
            });
            // console.log(response.data?.recommendedJobs)
            setResumeStatus(response.data?.resumeStatus);
            setRecommendedJobs(response.data?.sortedRecommendedJobs || []);
            setTotalJobs(response.data?.pagination?.totalJobs || 0);
            setTotalPages(response.data?.pagination?.totalPages || 0);
            setCurrentPage(response.data?.pagination?.currentPage || 1);
        } catch (error) {
            console.error("Fetching recommended jobs failed:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecommendedJobs(1);
    }, [fetchRecommendedJobs]);

    // Poll every 5 seconds ONLY while resume is processing
    useEffect(() => {
        if (resumeStatus !== "processing") {
            return;
        }

        const intervalID = setInterval(() => {
            fetchRecommendedJobs();
        }, 5000);

        return () => clearInterval(intervalID);
    }, [resumeStatus, fetchRecommendedJobs]);
    
    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden", { replace: true });
        }
    }, [loading, verified, navigate]);

    if (loading) {
        return <Loading />
    }

    if (!verified) {
        return null;
    }

    return (
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />
                <Overlay />

                <div className="w-full bg-linear-to-t from-[#098B5F] to-[#10B981] flex items-center justify-center flex-col p-6">
                    <h1 className="text-xl font-bold text-white mb-5">Find jobs that match your skills</h1>

                    <form onSubmit={handleSubmit} >
                        <div className="relative w-full">
                            <input 
                                className="bg-white rounded-md py-2 pl-12 pr-4 w-70 mb-2 block" 
                                type="text"
                                placeholder="Search job positions"
                                value={jobSearch.jobTitle}
                                onChange={(e) => {
                                    setJobSearch({...jobSearch, jobTitle: e.target.value})
                                }}
                                required
                            />
                            <LuBriefcase className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                        </div>

                        <div className="relative w-full">
                            <input 
                                className="bg-white rounded-md py-2 pl-12 pr-4 w-70 block mb-2" 
                                type="text"
                                placeholder="Enter city or region"
                                value={jobSearch.location}
                                onChange={(e) => {
                                    setJobSearch({...jobSearch, location: e.target.value})
                                }}
                            />
                            <MdOutlineLocationOn size={20} className="absolute top-1/2 -translate-y-1/2 left-3.75 text-gray-400" />
                            
                        </div>
                        {/* {isSearchingLocation && (
                                <p className="mt-1 text-xs text-white">
                                    Searching locations...
                                </p>
                        )} */}
                        
                        <div className="w-full relative">
                            {locationSuggestions.length > 0 && (
                                <ul className="absolute z-30 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                                    {locationSuggestions.map((place) => (
                                        <li
                                            key={place.placeId}
                                            onClick={() => {
                                                handleSelectLocation(place)
                                            }}
                                            className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                                        >
                                            {[
                                                place.city,
                                                place.state
                                            ].filter(Boolean).join(", ")}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <PrimaryButton type="submit" className="bg-[#86EFAC] mb-2 text-black! w-full active:scale-[0.97]">Search</PrimaryButton>
                    </form>
                </div>

                {(resumeStatus === "processing") && 
                    <div className="p-6">
                        <h1 className="text-2xl font-bold">Recommended Jobs</h1>
                        <p className="mt-2 text-gray-600">
                            We are still analyzing your resume. Your recommended jobs will appear shortly.
                        </p>
                    </div>
                }

                {(resumeStatus === "failed") &&
                    <div className="p-6">
                        <h1 className="text-2xl font-bold">Resume Processing Failed</h1>
                        <p className="mt-2 text-gray-600">
                            We could not analyze your resume. Please upload your resume again.
                        </p>
                    </div>
                }

                {(resumeStatus === "missing") &&
                    <div className="p-6">
                        <h1 className="text-2xl font-bold">Recommended Jobs</h1>
                        <p className="mt-2 text-gray-600">
                            Upload your resume first to get personalized job recommendations.
                        </p>
                    </div>
                }


                {(resumeStatus === "active") &&
                    <div className="w-full p-6">
                        {isSearchingJob ? 
                            <div className="w-full min-h-full flex flex-col justify-center items-center">
                                <BiLoaderAlt size={25} className="animate-spin mb-3" />
                                <p className="animate-pulse font-bold text-md">Finding relevant jobs</p>
                            </div>
                        :
                            <>
                                <h1 className="text-xl font-bold mb-2">Recommended Jobs</h1>
                                <p className="text-sm text-gray-500 mb-4">Found {totalJobs} jobs for you</p>

                                <div className="flex flex-col gap-6 w-full">
                                    {recommendedJobs.map((job) => {
                                        return (
                                            <div key={job.jobID} className="w-full bg-white shadow-md rounded-2xl p-4 relative">
                                                <button className="absolute top-4 right-4"><FaRegBookmark size={20} /></button>

                                                <div className={`${job.profilePhotoURL === null && "hidden"} w-25 mb-3`}>
                                                    <img className={`${job.profilePhotoURL === null && "hidden"} w-full rounded-lg` } src={job.profilePhotoURL}  alt="" />
                                                </div>
                                                <h1 className="text-xl font-bold">{job.jobTitle}</h1>
                                                <p className="text-md font-medium text-gray-500 mb-5">{job.companyName}</p>
                                                <div className="relative w-full mb-2">
                                                    <MdOutlineLocationOn size={20} className="absolute top-1/2 -translate-y-1/2" />
                                                    <span className="pl-7">{job.location}</span>
                                                </div>
                                                <div className="relative w-full mb-2">
                                                    <LuBriefcase size={20} className="absolute top-1/2 -translate-y-1/2" />
                                                    <span className="pl-7">{job.workType}</span>
                                                </div>
                                                <div className="relative w-full mb-5">
                                                    <PiMoneyWavy size={20} className="absolute top-1/2 -translate-y-1/2" />
                                                    <span className="pl-7">{job.minSalary.toLocaleString()} - {job.maxSalary.toLocaleString()}</span>
                                                </div>

                                                <PrimaryButton to={`/applicant/viewJob/${job.jobID}`} className="w-full">View Job Description</PrimaryButton>
                                            </div>
                                        )
                                    })}
                                    {totalPages > 1 && (
                                    <ReactPaginate
                                        pageCount={totalPages}
                                        forcePage={currentPage - 1}
                                        onPageChange={handlePageClick}
                                        previousLabel="<"
                                        nextLabel=">"
                                        breakLabel="..."
                                        marginPagesDisplayed={2}
                                        pageRangeDisplayed={3}
                                        containerClassName="flex justify-center items-center gap-4 mt-8 w-full"
                                        pageLinkClassName="px-4 py-3 rounded-lg text-lg"
                                        activeLinkClassName="bg-[#2B2B2B] text-white"
                                        previousLinkClassName="px-4 py-2 rounded-md bg-white shadow"
                                        nextLinkClassName="px-4 py-2 rounded-md bg-white shadow"
                                        disabledClassName="opacity-40 cursor-not-allowed"
                                    />
                                )}
                                </div>                            
                            </>
                        }
                    </div>
                }
            </div>

            <Footer />
        </>
    )
}