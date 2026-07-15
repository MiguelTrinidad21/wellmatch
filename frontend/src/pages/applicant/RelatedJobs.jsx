import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay"
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton"
import ApplicantSideBar from "../../components/navBars/ApplicantSideBar";
import defaultPhoto from "../../assets/defaultCover.jpg"
import { LuBriefcase } from "react-icons/lu";
import { MdOutlineLocationOn } from "react-icons/md";
import { PiMoneyWavy } from "react-icons/pi";
import { FaRegBookmark } from "react-icons/fa";
import { FaBookmark } from "react-icons/fa";
import { IoSearchSharp } from "react-icons/io5";
import { LuSearchX } from "react-icons/lu";
import { BiLoaderAlt } from "react-icons/bi";
import { userStore } from "../../zustand/userState";
import { jobSearchStore } from "../../zustand/jobSearching";
import { sideBarStore } from "../../zustand/stateHandlers";
import { FaRegBuilding } from "react-icons/fa6";
import { AiOutlineLaptop } from "react-icons/ai"
import { TbBuildingCommunity } from "react-icons/tb";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ReactPaginateModule from "react-paginate";


export default function RelatedJobs() {
    const ReactPaginate = ReactPaginateModule.default || ReactPaginateModule;

    const locationFieldRef = useRef(null);
    const rightColScrollRef = useRef(null);
    const [leftColHeight, setLeftColHeight] = useState(null);
    const [leftColNode, setLeftColNode] = useState(null);
    const leftColRef = useCallback((node) => {
        setLeftColNode(node);
    }, []);    

    const navigate = useNavigate();
    const { currentUser } = userStore();
    const { setApplicantActiveLink } = sideBarStore();
    const { 
        jobSearchResults, 
        setJobSearchResults, 
        jobSearch, 
        setJobSearch
    } = jobSearchStore();

    const [jobInfo, setJobInfo] = useState({
        jobID: null,
        coverPhotoURL: "",
        profilePhotoURL: "",
        jobTitle: "",
        companyName: "",
        location: "",
        workType: "",
        workPlaceOption: "",
        minSalary: "",
        maxSalary: "",
        jobOverview: "",
        jobDuties: "",
        requiredQualifications: "",
        preferredQualifications: "",
        workingConditions: "",
        jobBenefits: "",
    });

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

    const jobsPerPage = 10;

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
        if (!leftColNode) return;

        const updateHeight = () => {
            if (window.innerWidth >= 1280) {
                setLeftColHeight(leftColNode.offsetHeight);
            } else {
                setLeftColHeight(null);
            }
        };

        updateHeight();

        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(leftColNode);

        window.addEventListener("resize", updateHeight);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateHeight);
        };
    }, [leftColNode]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (locationFieldRef.current && !locationFieldRef.current.contains(e.target)) {
                setLocationSuggestions([]);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (rightColScrollRef.current) {
            rightColScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [jobInfo.jobID]);

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
        async function fetchSavedJobs() {
            const res = await axios.get("/api/applicant/getSavedJobs", {
                withCredentials: true
            });

            setSavedJobIDs(new Set(res.data.jobIDs));
        }

        fetchSavedJobs();
    }, [isJobSaved])

    useEffect(() => {
        setApplicantActiveLink("Home")
    },[])

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
            setJobInfo({})

            const jobResults = await axios.get("/api/applicant/searchJobs", {
                params: {
                    jobTitle: jobSearch.jobTitle,
                    location: jobSearch.location,
                    page,
                    limit: jobsPerPage
                },
                withCredentials: true
            });

            setJobSearchResults(jobResults.data || []);
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
        <div className="lg:flex relative w-full">
            <ApplicantSideBar />
            <SideBarOverlay />

            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />


                <div className="w-full bg-linear-to-t from-[#098B5F] to-[#10B981] flex items-center justify-center flex-col p-6 md:px-15 lg:p-10 xl:p-20">
                    <h1 className="text-xl font-bold text-white mb-5 md:text-3xl lg:text-4xl lg:mb-10 xl:text-5xl">Find jobs that match your skills</h1>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-2 xl:flex-row">
                        <div className="relative w-full flex items-center">
                            <input 
                                className="bg-white rounded-md py-2 pl-12 pr-4 w-70 outline-none transition-colors duration-200 ease-in-out border-2 border-gray-50 focus:border-gray-600 md:w-88 " 
                                type="text"
                                placeholder="Search job positions"
                                value={jobSearch.jobTitle ?? ""}
                                onChange={(e) => {
                                    setJobSearch({...jobSearch, jobTitle: e.target.value})
                                }}
                                required
                            />
                            <LuBriefcase className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-500" />
                        </div>

                        <div ref={locationFieldRef} className="relative w-full flex items-center">
                            <input 
                                className="bg-white rounded-md py-2 pl-12 pr-4 w-70 block outline-none transition-colors duration-200 ease-in-out border-2 border-gray-50 focus:border-gray-600 md:w-88" 
                                type="text"
                                placeholder="Enter city or region"
                                value={jobSearch.location ?? ""}
                                onChange={(e) => {
                                    setJobSearch({...jobSearch, location: e.target.value})
                                }}
                                
                            />
                            <MdOutlineLocationOn size={20} className="absolute top-1/2 -translate-y-1/2 left-3.75 text-gray-500" />
                            
                            {locationSuggestions.length > 0 && (
                                <ul className="absolute top-full z-30 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
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

                        <PrimaryButton type="submit" className="bg-[#86EFAC] cursor-pointer flex items-center justify-center gap-2 mb-2 text-black! w-full active:scale-[0.97] hover:bg-green-200 transition-colors duration-200 ease-in lg:bg-green-100 lg:px-8 lg:rounded-md lg:mb-0">Search</PrimaryButton>
                    </form>
                </div>


                
                <div className="w-full p-6 md:px-15 md:py-10 lg:px-10 xl:px-30">
                    {isSearchingJob ? 
                        <div className="w-full min-h-full flex flex-col justify-center items-center">
                            <BiLoaderAlt size={25} className="animate-spin mb-3" />
                            <p className="animate-pulse font-bold text-md">Finding relevant jobs</p>
                        </div>
                    :
                        <>
                            <div className="md:flex md:justify-between md:items-center md:mb-9">
                                <h1 className="text-xl font-bold mb-2 md:flex md:items-center md:mb-0 md:text-[22px]">Related Jobs</h1>
                                <p className="text-sm text-gray-500 mb-4 md:flex md:items-center md:mb-0 md:text-[16px]">{`Found ${totalJobs} ${totalJobs.length > 1 ? "jobs" : "job"} for you`}</p>
                            </div>

                            {jobSearchResults?.relatedJobs?.length === 0 ?
                                <div className="w-full flex flex-col items-center gap-3">
                                    <LuSearchX className="text-gray-500" size={70}/>
                                    <h1 className="text-gray-900 font-bold text-xl">No matching search results</h1>
                                    <p className="text-gray-600 font-medium text-sm text-center lg:text-[1rem]">Try adjusting your keywords or location to discover more opportunities.</p>
                                </div>
                            :
                                <div className="w-full xl:grid xl:grid-cols-2 xl:gap-5">
                                    {/* Left Column */}
                                    <div ref={leftColRef} className="flex flex-col gap-6 w-full">
                                        <div className="w-full grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-1 lg:gap-6">
                                            {jobSearchResults?.relatedJobs?.map((job) => {
                                                return (
                                                    <div 
                                                        onClick={() => setJobInfo({
                                                            jobID: job.jobID,
                                                            coverPhotoURL: job.coverPhotoURL,
                                                            profilePhotoURL: job.profilePhotoURL,
                                                            jobTitle: job.jobTitle,
                                                            companyName: job.companyName,
                                                            location: job.location,
                                                            workType: job.workType,
                                                            workPlaceOption: job.workPlaceOption,
                                                            minSalary: job.minSalary,
                                                            maxSalary: job.maxSalary,
                                                            jobOverview: job.jobOverview,
                                                            jobDuties: job.jobDuties,
                                                            requiredQualifications: job.requiredQualifications,
                                                            preferredQualifications: job.preferredQualifications,
                                                            workingConditions: job.workingConditions,
                                                            jobBenefits: job.jobBenefits
                                                        })}                                                     
                                                        key={job.jobID} 
                                                        className="xl:cursor-pointer box-border border-3 border-transparent hover:border-green-600 transition-all duration-200 ease-in w-full h-full bg-white shadow-md rounded-2xl p-4 relative md:p-8 flex flex-col"
                                                    >
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

                                                        {
                                                            savedJobIDs.has(job.jobID) ?
                                                                <FaBookmark className="absolute top-4 right-4 text-green-700 md:top-8 md:right-8 xl:top-auto xl:bottom-8" size={20} onClick={() => unsaveJob(job.jobID)} />
                                                            :
                                                                <FaRegBookmark className="absolute top-4 right-4 md:top-8 md:right-8 xl:top-auto xl:bottom-8" size={20} onClick={() => saveJob(job.jobID)} />
                                                        }

                                                        <PrimaryButton to={`/applicant/viewJob/${job.jobID}`} className="w-full mt-auto xl:hidden">View Job Description</PrimaryButton>
                                                    </div>
                                                )
                                            })}
                                        </div>                        
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
                                    
                                    {/* Right Column */}
                                    <div className="hidden xl:block xl:sticky xl:top-22 xl:self-start">
                                        <div 
                                            ref={rightColScrollRef}
                                            style={{
                                                maxHeight: leftColHeight 
                                                    ? `min(${leftColHeight}px, calc(100vh - 6rem))`
                                                    : `calc(100vh - 6rem)`
                                                }}  
                                            className="hidden xl:block bg-white w-full min-w-0 shadow-md rounded-2xl overflow-y-auto"
                                        >
                                            {
                                                !jobInfo.jobID ? <h1 className="text-center font-semibold text-gray-500 my-70">Select a job post to view information</h1>
                                                :
                                                    <>
                                                        <div className="w-full rounded-tl-2xl rounded-tr-2xl ">
                                                            <img 
                                                                src={jobInfo.coverPhotoURL ? jobInfo.coverPhotoURL : defaultPhoto} 
                                                                alt="cover photo"
                                                                className="w-full h-45 object-cover rounded-tl-2xl rounded-tr-2xl md:h-55"
                                                            />
                                                        </div>

                                                        <div className="p-4 w-full mb-3 md:p-7">
                                                            <div className="w-full relative mb-4 overflow-hidden">
                                                                <img 
                                                                    src={jobInfo.profilePhotoURL ? jobInfo.profilePhotoURL : defaultPhoto} 
                                                                    alt="profile photo"
                                                                    className="w-25 object-cover rounded-sm md:rounded-xl md:w-30"
                                                                />
                                                                <PrimaryButton to={`/applicant/viewJob/${jobInfo.jobID}/chooseFile`} className="absolute top-0 right-0 text-black! bg-green-300 hover:bg-green-400 transition-colors duration-200 ease-in rounded-lg px-5 max-w-[60%] text-center whitespace-normal text-sm">View Skill Gap Analysis</PrimaryButton>
                                                            </div>
                                                            <div className="w-full mb-4">
                                                                <h1 className="text-xl font-bold">{jobInfo.jobTitle}</h1>
                                                                <p className="text-gray-500 mb-6">{jobInfo.companyName}</p>
                                                                <div className="relative w-full mb-2">
                                                                    <MdOutlineLocationOn className="absolute top-1/2 -translate-y-1/2" />
                                                                    <span className="pl-7 text-sm md:text-[16px]">{jobInfo.location}</span>
                                                                </div>
                                                                <div className="relative w-full mb-2">
                                                                    <LuBriefcase className="absolute top-1/2 -translate-y-1/2" />
                                                                    <span className="pl-7 text-sm md:text-[1rem]">{jobInfo.workType}</span>
                                                                </div>
                                                                <div className="relative w-full mb-2">
                                                                    {jobInfo.workPlaceOption === "On-site" ? <FaRegBuilding className="absolute top-1/2 -translate-y-1/2"/> 
                                                                    : jobInfo.workPlaceOption === "Remote" ? <AiOutlineLaptop className="absolute top-1/2 -translate-y-1/2" />
                                                                    : <TbBuildingCommunity className="absolute top-1/2 -translate-y-1/2" />                                
                                                                    }
                                                                    <span className="pl-7 text-sm md:text-[1rem]">{jobInfo.workPlaceOption}</span>
                                                                </div>
                                                                <div className="relative w-full mb-5">
                                                                    <PiMoneyWavy className="absolute top-1/2 -translate-y-1/2" />
                                                                    <span className="pl-7 text-sm md:text-[1rem]">{jobInfo?.minSalary?.toLocaleString()} - {jobInfo?.maxSalary?.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                            <div className="lg:flex lg:gap-3">
                                                                <PrimaryButton to={`/applicant/viewJob/${jobInfo.jobID}/apply`} className="w-full mb-2 lg:mb-0">Apply Now</PrimaryButton>
                                                                {
                                                                    savedJobIDs.has(jobInfo.jobID) ?
                                                                        <SecondaryButton onclick={() => unsaveJob(jobInfo.jobID)} className="w-full py-2 font-bold! border-none bg-green-100 lg:py-0">Saved</SecondaryButton>
                                                                    :
                                                                        <SecondaryButton onclick={() => saveJob(jobInfo.jobID)} className="w-full py-2 font-bold! lg:py-0">Save</SecondaryButton>
                                                                }
                                                                
                                                            </div>
                                                        </div>

                                                        <div className="w-full px-4 pb-4 md:p-7">
                                                            <h1 className="text-lg font-bold text-center mb-2">Job Desciption</h1>
                                                            <p className="text-justify indent-8 text-[15px] mb-3">{jobInfo.jobOverview}</p>

                                                            <h2 className="font-bold">Job Responsibilities</h2>
                                                            <div
                                                                className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: jobInfo.jobDuties?.replace(/&nbsp;/g, ' ')
                                                                }}
                                                            />

                                                            <h2 className="font-bold">Required Qualifications</h2>
                                                            <div
                                                                className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: jobInfo.requiredQualifications?.replace(/&nbsp;/g, ' ')
                                                                }}
                                                            />

                                                            {jobInfo.preferredQualifications &&
                                                                <>
                                                                    <h2 className="font-bold">Preferred Qualifications</h2>
                                                                    <div
                                                                        className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: jobInfo.preferredQualifications?.replace(/&nbsp;/g, ' ')
                                                                        }}
                                                                    />                                
                                                                </>                           
                                                            }

                                                            {jobInfo.workingConditions &&
                                                                <>
                                                                    <h2 className="font-bold">Working Conditions</h2>
                                                                    <div
                                                                        className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: jobInfo.workingConditions?.replace(/&nbsp;/g, ' ')
                                                                        }}
                                                                    />                                
                                                                </>                           
                                                            }

                                                            {jobInfo.jobBenefits &&
                                                                <>
                                                                    <h2 className="font-bold">Job Benefits</h2>
                                                                    <div
                                                                        className="prose max-w-none text-[15px] [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-black [&_li::marker]:text-black"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: jobInfo.jobBenefits?.replace(/&nbsp;/g, ' ')
                                                                        }}
                                                                    />                                
                                                                </>                           
                                                            }
                                                        </div>                                                                                                                                                               
                                                    </>
                                            }
                                        </div>                            

                                    </div>
                                </div>

                            }
                        </>    
                    }
                </div>
                
            </div>

        </div>
    )
}