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
import { FaBookmark } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { userStore } from "../../zustand/userState";
import { sideBarStore } from "../../zustand/stateHandlers";
import { jobSearchStore } from "../../zustand/jobSearching";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ReactPaginateModule from "react-paginate";


export default function RelatedJobs() {
    const ReactPaginate = ReactPaginateModule.default || ReactPaginateModule;
    
    const navigate = useNavigate();
    const { currentUser } = userStore();
    const { setApplicantActiveLink } = sideBarStore();
    const { 
        jobSearchResults, 
        setJobSearchResults, 
        jobSearch, 
        setJobSearch
    } = jobSearchStore();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSearchingJob, setIsSearchingJob] = useState(false);

    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [isLocationSelected, setIsLocationSelected] = useState(false);
    const [lastSelectedLocation, setLastSelectedLocation] = useState(jobSearch.location);
    const prevLocationRef = useRef(jobSearch.location);
    
    const [currentPage, setCurrentPage] = useState(jobSearchResults?.pagination?.currentPage);
    const [totalPages, setTotalPages] = useState(jobSearchResults?.pagination?.totalPages);
    const [totalJobs, setTotalJobs] = useState(jobSearchResults?.relatedJobs?.length);

    const [isJobSaved, setIsJobSaved] = useState(false);
    const [savedJobIDs, setSavedJobIDs] = useState(new Set());

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
        const searchText = (jobSearch.location ?? "").trim();

        if (prevLocationRef.current === jobSearch.location) {
            return;
        }

        prevLocationRef.current = jobSearch.location;

        if (isLocationSelected && (lastSelectedLocation === jobSearch.location)) {
            return;
        } 

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
    }, [jobSearch.location]);

    useEffect(() => {
        setApplicantActiveLink("home")
    }, [])

    useEffect(() => {
        async function fetchSavedJobs() {
            const res = await axios.get("/api/applicant/getSavedJobs", {
                withCredentials: true
            });

            setSavedJobIDs(new Set(res.data.jobIDs));
        }

        fetchSavedJobs();
    }, [isJobSaved])

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
        setIsLocationSelected(true)
        setLocationSuggestions([]);
    }

    async function fetchRelatedJobs(page = 1) {
        try {
            setIsSearchingJob(true);

            const jobResults = await axios.get("/api/applicant/searchJobs", {
                params: {
                    jobTitle: jobSearch.jobTitle,
                    location: jobSearch.location,
                    page,
                    limit: jobsPerPage
                },
                withCredentials: true
            });

            setJobSearchResults(jobResults.data?.relatedJobs || []);
            console.log(jobResults.data)
            setTotalJobs(jobResults.data?.pagination?.totalJobs || 0);
            setTotalPages(jobResults.data?.pagination?.totalPages || 0);
            setCurrentPage(jobResults.data?.pagination?.currentPage || 1);
        } catch (error) {
            console.log(error)
            console.error("Searching jobs failed:", error.response?.data || error.message);
        } finally {
            setIsSearchingJob(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await fetchRelatedJobs(1);
    }

    function handlePageClick(event) {
        const selectedPage = event.selected + 1;
        fetchRelatedJobs(selectedPage);
    }

    
    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden");
        }
    }, [loading, verified, navigate]);

    // if (loading) {
    //     return <Loading />
    // }

    if (!verified) {
        return null;
    }

    return (
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />
                <Overlay />

                <div className="w-full bg-linear-to-t from-[#098B5F] to-[#10B981] flex items-center justify-center flex-col p-6 md:px-15">
                    <h1 className="text-xl font-bold text-white mb-5 md:text-3xl">Find jobs that match your skills</h1>

                    <form onSubmit={handleSubmit} >
                        <div className="relative w-full">
                            <input 
                                className="bg-white rounded-md py-2 pl-12 pr-4 w-70 mb-2 block md:w-88" 
                                type="text"
                                placeholder="Search job positions"
                                value={jobSearch.jobTitle ?? ""}
                                onChange={(e) => {
                                    setJobSearch({...jobSearch, jobTitle: e.target.value})
                                }}
                                required
                            />
                            <LuBriefcase className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                        </div>

                        <div className="relative w-full">
                            <input 
                                className="bg-white rounded-md py-2 pl-12 pr-4 w-70 block mb-2 md:w-88" 
                                type="text"
                                placeholder="Enter city or region"
                                value={jobSearch.location ?? ""}
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


                
                <div className="w-full p-6 md:px-15 md:py-10">
                    {isSearchingJob ? 
                        <div className="w-full min-h-full flex flex-col justify-center items-center">
                            <BiLoaderAlt size={25} className="animate-spin mb-3" />
                            <p className="animate-pulse font-bold text-md">Finding relevant jobs</p>
                        </div>
                    :
                        <>
                            <div className="md:flex md:justify-between md:items-center md:mb-9">
                                <h1 className="text-xl font-bold mb-2 md:flex md:items-center md:mb-0 md:text-[22px]">Related Jobs</h1>
                                <p className="text-sm text-gray-500 mb-4 md:flex md:items-center md:mb-0 md:text-[16px]">Found {totalJobs} jobs for you</p>
                            </div>

                            <div className="flex flex-col gap-6 w-full">
                                {jobSearchResults?.relatedJobs?.map((job) => {
                                    return (
                                        <div key={job.jobID} className="w-full bg-white shadow-md rounded-2xl p-4 relative md:p-8">
                                            {
                                                savedJobIDs.has(job.jobID) ?
                                                    <FaBookmark className="absolute top-4 right-4 text-green-700 md:top-8 md:right-8" size={20} onClick={() => unsaveJob(job.jobID)} />
                                                :
                                                    <FaRegBookmark className="absolute top-4 right-4 md:top-7 md:right-8" size={20} onClick={() => saveJob(job.jobID)} />
                                            }

                                            <div className={`${job.profilePhotoURL === null && "hidden"} w-25 mb-3 md:w-30`}>
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
                                        containerClassName="flex justify-center items-center gap-4 mt-6 w-full"
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
                
            </div>

            <Footer />
        </>
    )
}