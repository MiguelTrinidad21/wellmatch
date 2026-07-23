import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import EmployerSideBar from "../../components/navBars/EmployerSideBar";
import Loading from "../../components/others/Loading"
import WarningBox from "../../components/popUps/WarningBox";
import Translucent from "../../components/overlay/Translucent";
import ConfirmationDialog from "../../components/popUps/ConfirmationDialog";
import JobInfoSide from "../../components/popUps/JobInfoSide";
import { userStore } from "../../zustand/userState";
import { sideBarStore, jobCreationStore, jobInfoStore } from "../../zustand/stateHandlers";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { TbBriefcase2 } from "react-icons/tb";
import { TbBriefcaseOff } from "react-icons/tb";
import { GrLocation } from "react-icons/gr";
import { MdGroups } from "react-icons/md";
import { IoPersonOutline } from "react-icons/io5";
import { IoEllipsisVertical } from "react-icons/io5";
import { FiCalendar } from "react-icons/fi";
import { AiOutlineEye } from "react-icons/ai";
import { FaPlus } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import { FaCheck } from "react-icons/fa6";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton"
import useIsDesktop from "../../hooks/useIsDesktop";

export default function Jobs() {
    const { currentUser } = userStore();
    const { setEmployerActiveLink } = sideBarStore();
    const { displayJob, setDisplayJob, setJobInfo } = jobInfoStore();
    const { clearCreatedJob } = jobCreationStore();
    const isDesktop = useIsDesktop();
    const navigate = useNavigate();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [jobStatus, setJobStatus] = useState("open");
    const [listOfJobs, setListOfJobs] = useState([]);

    const [applicantList, setApplicantList] = useState([]);

    const [isJobToClose, setIsJobToClose] = useState(false);
    const [isJobToOpen, setIsJobToOpen] = useState(false)
    const [isJobClosing, setIsJobClosing] = useState(false)
    const [closingError, setClosingError] = useState("");
    const [jobHasChanged, setJobHasChanged] = useState(false);
    const [closingJobID, setClosingJobID] = useState(null);
    const [reOpenJobID, setReOpenJobID] = useState(null);

    const [showMenu, setShowMenu] = useState(false);
    const [menuID, setMenuID] = useState(null);
 
    useEffect(() => {
        setEmployerActiveLink("jobs")
    }, [])

    useEffect(() => {
        async function checkEmployer() {
            setLoading(true);

            try {
                // console.log(currentUser);
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    return;
                }

                await axios.get("/api/employer/authorize", {
                    params: {
                        employerID: currentUser.employerID
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

        checkEmployer();
    }, [currentUser]);

    useEffect(() => {
        setEmployerActiveLink("Jobs")
    }, []);

    useEffect(() => {
        async function getJobs() {
            // setJobStatus("open");

            try {
                const allJobs = await axios.get("/api/employer/getJobs", {
                    params: { jobStatus },
                    withCredentials: true
                })

                setListOfJobs(allJobs.data.fetchedJobs);
                setApplicantList(allJobs.data.totalApplicants);
                
            } catch (error) {
                console.log(error);
            }
        }

        getJobs();
    }, [jobStatus, jobHasChanged])

    function formatDate(dateString) {
        return new Date(dateString).toLocaleString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",            
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function displayJobInfo(
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
    ) {
        setJobInfo({
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
        });

        setDisplayJob()
        setShowMenu(false); 
        if (!isDesktop) {
            navigate(`/employer/jobs/viewJob/${jobID}`);
        }
    }

    function toggleWarning(jobID) {
        if (jobID) {
            setClosingJobID(jobID);
        }
        setIsJobToClose(!isJobToClose)
        setClosingError("");
        setShowMenu(false);
    }


    function showReOpenBox(jobID) {
        if (jobID) {
            setReOpenJobID(jobID);
        }
        setIsJobToOpen(true)
        setShowMenu(false);        
    }

    function viewApplicants(jobID) {
        setEmployerActiveLink("applicants");
        navigate(`/employer/jobs/${jobID}/applicants`)
    }

    async function closeJob() {
        setIsJobClosing(true);
        setJobHasChanged(!jobHasChanged)

        try {
            axios.patch(`/api/employer/job/close/${closingJobID}`, 
                { withCredentials: true }
            )

            // setJobHasChanged(!jobHasChanged);
            setIsJobToClose(!isJobToClose)
            setJobStatus("closed")
        } catch (error) {
            console.log(error)
            setClosingError("Closing job failed. Please try again")
        } finally {
            setIsJobClosing(false);
            // setJobHasChanged(!jobHasChanged);
        }
    }


    async function reopenJob() {
        // setIsJobClosing(true);
        setJobHasChanged(!jobHasChanged)

        try {
            axios.patch(`/api/employer/job/reOpen/${reOpenJobID}`, 
                { withCredentials: true }
            )

            // setJobHasChanged(!jobHasChanged);
            setIsJobToOpen(false);
            setJobStatus("open")
        } catch (error) {
            console.log(error)
            // setClosingError("Closing job failed. Please try again")
        } 
    }
    
    useEffect(() => {
        function handleClickOutside(event) {
            if (!event.target.closest("[data-job-menu]")) {
                setShowMenu(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        <div className="lg:flex relative w-full">
            <SideBarOverlay />
            <EmployerSideBar />
            <JobInfoSide display={displayJob} />

            <PrimaryButton onClick={() => {
                clearCreatedJob();
            }} className="w-fit fixed! bottom-6! right-6! z-30 shadow-xl md:hidden text-center rounded-lg">
                <Link className="flex gap-3 items-center justify-center md:gap-5 lg:gap-2" to="/employer/createJob">
                    <FaPlus />
                    Create Job Post
                </Link>
            </PrimaryButton>              

            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />

                {isJobToClose && 
                    <>
                        <Translucent />
                        <WarningBox
                            heading="Close this job post?"
                            text="This will mark the job as inactive. New candidates will no longer be able to view or apply for this position, but you can still access existing applicants."
                            buttonText="Close Job"
                            action={{closeJob, toggleWarning}}
                            error={closingError}
                            isLoading={isJobClosing}
                        />
                    </>                    
                }

                {isJobToOpen && 
                    <>
                        <Translucent />
                        <ConfirmationDialog
                            heading="Re-open job posting?"
                            bodyText="This job posting will become active again and visible to applicants. You can continue receiving new applications while keeping your existing applicants and job details."
                            buttonText="Re-open"
                            toggleFunction={() => setIsJobToOpen(false)}
                            confirmFunction={reopenJob}
                        />
                    </>                    
                }


                <div className="w-full pb-25 p-6 md:px-15 md:py-10 lg:px-10 xl:px-30">
                    <h1 className="font-bold text-2xl lg:text-3xl mb-2">Company Job Posts</h1>
                    <p className="text-gray-600 lg:text-lg font-medium mb-4 xl:mb-10">Manage your company's job posts</p>

                    <div className="grid grid-cols-2 w-full xl:w-200 xl:m-auto xl:mb-10 rounded-xl shadow-md mb-10">
                        <button
                            onClick={() => setJobStatus("open")}
                            className={`
                                ${jobStatus === "open" ? "bg-[#047857] text-white duration-200" : "bg-white text-black"} cursor-pointer py-4 rounded-tl-xl rounded-bl-xl font-bold`
                            }>
                            <div className="flex items-center gap-2 justify-center"><TbBriefcase2 className="inline" size={20}/> Open</div>
                        </button>
                        <button 
                            onClick={() => setJobStatus("closed")}
                            className={`
                                ${jobStatus === "closed" ? "bg-red-700 text-white duration-200" : "bg-white text-black"} cursor-pointer py-4 rounded-tr-xl rounded-br-xl font-bold`
                            }>
                            <div className="flex items-center gap-2 justify-center"><TbBriefcaseOff className="inline" size={20}/> Closed</div>
                        </button>
                    </div>

                    <div className="md:flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-bold text-xl mb-1 md:mb-0" >{jobStatus === "open" ? `Open ${listOfJobs.length > 1 ? "Positions" : "Position"} (${listOfJobs.length})` : `Closed ${listOfJobs.length > 1 ? "Jobs" : "Job"} (${listOfJobs.length})`}</h2>
                            {
                                jobStatus === "open"
                                    ? <p className="text-sm xl:text-[1rem] text-gray-500 font-medium mb-0">{`${listOfJobs.length} ${listOfJobs.length > 1 ? "positions" : "position"} currently accepting applications`}</p>
                                    : <p className="text-sm xl:text-[1rem] text-gray-500 font-medium mb-0">{`${listOfJobs.length} ${listOfJobs.length > 1 ? "positions" : "position"} no longer accepting applications`}</p>                                 
                            }
                            
                        </div>
                        <PrimaryButton onClick={() => {
                            clearCreatedJob();
                        }} className="w-fit hidden md:block text-center rounded-lg">
                            <Link className="flex gap-3 items-center justify-center md:gap-5 lg:gap-2" to="/employer/createJob">
                                <FaPlus />
                                Create Job Post
                            </Link>
                        </PrimaryButton>                        
                    </div>
                
                    {listOfJobs.length === 0 ?
                        <p className="text-center text-gray-600 font-medium mt-20">There are no current job posts for this section</p>
                    :
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                            {
                                listOfJobs.map((eachJob) => {
                                    let totalApplicants = 0;

                                    if (applicantList.length !== 0) {
                                        for (const eachApplicant of applicantList) {
                                            if (eachApplicant.jobID === eachJob.jobID) {
                                                totalApplicants++;
                                            }
                                        }
                                    }

                                    if (jobStatus === "open") {
                                        return (
                                            <div key={eachJob.jobID} className="relative w-full h-full flex flex-col rounded-2xl shadow-lg bg-white p-6">

                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="rounded-lg bg-[#E7F6EF] flex gap-2 items-center px-2 py-1 w-fit">
                                                        <div className="w-2 h-2 bg-green-700 rounded-full"></div>
                                                        <p className="text-sm font-bold text-green-700">OPEN</p>    
                                                    </div>

                                                    <div data-job-menu className="relative">
                                                        <IoEllipsisVertical 
                                                            onClick={() => {
                                                                setMenuID(eachJob.jobID)
                                                                setShowMenu(!showMenu)
                                                            }} 
                                                            size={20}
                                                            className="cursor-pointer"
                                                        /> 
                                                                                                        
                                                        <div className={`w-25 bg-slate-100  p-1 absolute top-full right-0 rounded-md shadow-lg transition-opacity duration-150 ease-out ${(showMenu && menuID === eachJob.jobID) ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                                                            <PrimaryButton 
                                                                onClick={() => displayJobInfo(
                                                                    eachJob.jobID,
                                                                    eachJob.coverPhotoURL,
                                                                    eachJob.profilePhotoURL,
                                                                    eachJob.jobTitle,
                                                                    eachJob.companyName,
                                                                    eachJob.location,
                                                                    eachJob.workType,
                                                                    eachJob.workPlaceOption,
                                                                    eachJob.minSalary,
                                                                    eachJob.maxSalary,
                                                                    eachJob.jobOverview,
                                                                    eachJob.jobDuties,
                                                                    eachJob.requiredQualifications,
                                                                    eachJob.preferredQualifications,
                                                                    eachJob.workingConditions,
                                                                    eachJob.jobBenefits
                                                                )} 
                                                                className="bg-slate-100 text-gray-600! font-semibold flex items-center gap-2"
                                                            >
                                                                <AiOutlineEye />
                                                                View
                                                            </PrimaryButton>

                                                            <PrimaryButton to={`/employer/jobs/${eachJob.jobID}/edit`} className="bg-slate-100 text-green-600! font-semibold flex items-center gap-2">
                                                                <MdEdit />
                                                                Edit
                                                            </PrimaryButton>

                                                            <PrimaryButton onClick={() => toggleWarning(eachJob.jobID)} className="bg-slate-100 text-red-600! px-0 font-semibold flex items-center gap-1">
                                                                <IoClose size={20} />
                                                                Close
                                                            </PrimaryButton>
                                                        </div>
                                                        
                                                    </div>
                                                </div>
                                                
                                                <h1 className="w-[85%] font-bold text-[1.1rem] text-[#111827] mb-2 ">{eachJob.jobTitle}</h1>
                                                <p className="flex items-center text-[#374151] gap-3 mb-1 justify-items-start text-sm"><GrLocation className="text-gray-500 w-5 shrink-0" /> {eachJob.location}</p>
                                                <hr className="border-none h-0.5 bg-gray-200 mt-3 mb-4"/>

                                                <div className="flex items-center text-green-700 bg-[#E7F6EF] rounded-lg text-sm py-1 px-3 w-fit font-bold gap-3 mb-4"><MdGroups size={20} className="text-green-700 w-5 shrink-0" /> {`${totalApplicants} ${totalApplicants > 1 ? "Applicants" : "Applicant"}`}</div>

                                                <div className="flex gap-3 items-center mb-2">
                                                    <FiCalendar className="text-gray-500" />
                                                    <p className="text-sm text-gray-700 font-medium">{eachJob.updatedAt > eachJob.createdAt ? "Last Updated" : "Job Posted"}</p>
                                                </div>
                                                <div className="pl-6.5">
                                                    <p className="text-gray-500 mb-1 font-medium text-sm">{eachJob.updatedAt > eachJob.createdAt ? `${formatDate(eachJob.updatedAt)}` : `${formatDate(eachJob.createdAt)}`}</p>
                                                    <p className="text-gray-500 font-medium text-sm">{eachJob.updatedAt > eachJob.createdAt ? `by ${eachJob.updatedByFirstName} ${eachJob.updatedByLastName}` : `by ${eachJob.createdByFirstName} ${eachJob.createdByLastName}`}</p>
                                                </div>
                                                
                                                <div className="w-full mt-auto pt-10">
                                                    <SecondaryButton className="font-bold! rounded-lg" to={`/employer/jobs/${eachJob.jobID}/applicants`}>View Applicants</SecondaryButton>
                                                </div>
                                            </div>
                                        )
                                    } else {
                                        return (
                                            <div key={eachJob.jobID} className="relative w-full h-full flex flex-col rounded-2xl shadow-md bg-white p-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="rounded-lg bg-red-50 flex gap-2 items-center px-2 py-1 w-fit">
                                                        <div className="w-2 h-2 bg-red-700 rounded-full"></div>
                                                        <p className="text-sm font-bold text-red-700">Closed</p>    
                                                    </div>

                                                    <div data-job-menu className="relative">
                                                        <IoEllipsisVertical 
                                                            onClick={() => {
                                                                setMenuID(eachJob.jobID)
                                                                setShowMenu(!showMenu)
                                                            }} 
                                                            size={20}
                                                            className="cursor-pointer"
                                                        /> 
                                                                                                        
                                                        <div className={`w-35 bg-slate-100  p-1 absolute top-full right-0 rounded-md shadow-lg transition-opacity duration-150 ease-out ${(showMenu && menuID === eachJob.jobID) ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                                                            <PrimaryButton 
                                                                onClick={() => displayJobInfo(
                                                                    eachJob.jobID,
                                                                    eachJob.coverPhotoURL,
                                                                    eachJob.profilePhotoURL,
                                                                    eachJob.jobTitle,
                                                                    eachJob.companyName,
                                                                    eachJob.location,
                                                                    eachJob.workType,
                                                                    eachJob.workPlaceOption,
                                                                    eachJob.minSalary,
                                                                    eachJob.maxSalary,
                                                                    eachJob.jobOverview,
                                                                    eachJob.jobDuties,
                                                                    eachJob.requiredQualifications,
                                                                    eachJob.preferredQualifications,
                                                                    eachJob.workingConditions,
                                                                    eachJob.jobBenefits
                                                                )} 
                                                                className="bg-slate-100 text-gray-600! font-semibold flex items-center gap-2"
                                                            >
                                                                <AiOutlineEye />
                                                                View
                                                            </PrimaryButton>

                                                            <PrimaryButton onClick={() => showReOpenBox(eachJob.jobID)} className="bg-slate-100 text-green-600! font-semibold flex items-center gap-2">
                                                                <FaCheck />
                                                                Re-open
                                                            </PrimaryButton>
                                                        </div>
                                                        
                                                    </div>                                                
                                                </div>

                                                <h1 className="w-[85%] font-bold text-[1.1rem] text-[#111827] mb-2 ">{eachJob.jobTitle}</h1>
                                                <p className="flex items-center text-[#374151] gap-3 mb-1 justify-items-start text-sm"><GrLocation className="text-gray-500 w-5 shrink-0" /> {eachJob.location}</p>
                                                <hr className="border-none h-0.5 bg-gray-200 mt-3 mb-4"/>

                                                <div className="flex items-center text-green-700 bg-[#E7F6EF] rounded-lg text-sm py-1 px-3 w-fit font-bold gap-3 mb-4"><MdGroups size={20} className="text-green-700 w-5 shrink-0" /> {`${totalApplicants} ${totalApplicants > 1 ? "Applicants" : "Applicant"}`}</div>

                                                <div className="flex gap-3 items-center mb-2">
                                                    <FiCalendar className="text-gray-500" />
                                                    <p className="text-sm text-gray-700 font-medium">{eachJob.updatedAt > eachJob.createdAt ? "Last Updated" : "Job Posted"}</p>
                                                </div>
                                                <div className="pl-6.5">
                                                    <p className="text-gray-500 mb-1 font-medium text-sm">{eachJob.updatedAt > eachJob.createdAt ? `${formatDate(eachJob.updatedAt)}` : `${formatDate(eachJob.createdAt)}`}</p>
                                                    <p className="text-gray-500 font-medium text-sm">{eachJob.updatedAt > eachJob.createdAt ? `by ${eachJob.updatedByFirstName} ${eachJob.updatedByLastName}` : `by ${eachJob.createdByFirstName} ${eachJob.createdByLastName}`}</p>
                                                </div>
                                                
                                                <div className="w-full mt-auto pt-10">
                                                    <SecondaryButton className="w-full rounded-lg font-bold!" onclick={() => viewApplicants(eachJob.jobID)}>View Applicants</SecondaryButton>
                                                </div>
                                            </div>
                                        )
                                    }
                                })
                            }
                        </div>
                    }
                </div>

                
            </div>
            
        </div>
    );
}