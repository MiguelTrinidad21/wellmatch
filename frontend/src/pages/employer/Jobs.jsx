import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Loading from "../../components/others/Loading"
import Footer from "../../components/others/Footer"
import WarningBox from "../../components/popUps/WarningBox";
import Translucent from "../../components/overlay/Translucent";
import ConfirmationDialog from "../../components/popUps/ConfirmationDialog";
import { userStore } from "../../zustand/userState";
import { sideBarStore } from "../../zustand/stateHandlers";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TbBriefcase2 } from "react-icons/tb";
import { GrLocation } from "react-icons/gr";
import { MdGroups } from "react-icons/md";
import { IoPersonOutline } from "react-icons/io5";
import { IoEllipsisVertical } from "react-icons/io5";
import { AiOutlineEye } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { FaCheck } from "react-icons/fa6";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton"

export default function Jobs() {
    const { currentUser } = userStore();
    const { setEmployerActiveLink } = sideBarStore();
    const navigate = useNavigate();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [jobStatus, setJobStatus] = useState("open");
    const [listOfJobs, setListOfJobs] = useState([]);

    const [applicantList, setApplicantList] = useState([]);

    const [isJobToClose, setIsJobToClose] = useState(false);
    const [isJobToDelete, setIsJobToDelete] = useState(false)
    const [isJobToOpen, setIsJobToOpen] = useState(false)
    const [isJobClosing, setIsJobClosing] = useState(false)
    const [closingError, setClosingError] = useState("");
    const [jobHasChanged, setJobHasChanged] = useState(false);
    const [closingJobID, setClosingJobID] = useState(null);
    const [deletingJobID, setDeletingJobID] = useState(null);
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

    function toggleWarning(jobID) {
        if (jobID) {
            setClosingJobID(jobID);
        }
        setIsJobToClose(!isJobToClose)
        setClosingError("");
        setShowMenu(false);
    }

    function toggleDelete(jobID) {
        if (jobID) {
            setDeletingJobID(jobID);
        }
        setIsJobToDelete(!isJobToDelete)
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
        // setJobHasChanged(false)

        try {
            axios.patch(`/api/employer/job/close/${closingJobID}`, 
                { withCredentials: true }
            )

            setJobHasChanged(!jobHasChanged);
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
        // setJobHasChanged(false)

        try {
            axios.patch(`/api/employer/job/reOpen/${reOpenJobID}`, 
                { withCredentials: true }
            )

            setJobHasChanged(!jobHasChanged);
            setIsJobToOpen(false);
            setJobStatus("open")
        } catch (error) {
            console.log(error)
            // setClosingError("Closing job failed. Please try again")
        } 
    }



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

                {isJobToDelete && 
                    <>
                        <Translucent />
                        <WarningBox
                            heading="Delete this job post?"
                            text="This will mark the job as inactive. New candidates will no longer be able to view or apply for this position, but you can still access existing applicants."
                            buttonText="Close Job"
                            action={{closeJob, toggleWarning}}
                            error={closingError}
                            isLoading={isJobClosing}
                        />
                    </>                    
                }

                <div className="w-full p-6 md:px-15 md:py-10">
                    <h1 className="font-bold text-2xl mb-2">Company Job Posts</h1>
                    <p className="text-gray-500 mb-4">Manage your company's job posts</p>

                    <div className="grid grid-cols-2 w-full rounded-xl shadow-md mb-10">
                        <button
                            onClick={() => setJobStatus("open")}
                            className={`
                                ${jobStatus === "open" ? "bg-[#10B981] text-white duration-200" : "bg-white text-black"} py-4 rounded-tl-xl rounded-bl-xl font-bold`
                            }>
                            <div className="flex items-center gap-2 justify-center"><TbBriefcase2 className="inline" size={20}/> Open</div>
                        </button>
                        <button 
                            onClick={() => setJobStatus("closed")}
                            className={`
                                ${jobStatus === "closed" ? "bg-[#10B981] text-white duration-200" : "bg-white text-black"} py-4 rounded-tr-xl rounded-br-xl font-bold`
                            }>
                            <div className="flex items-center gap-2 justify-center"><TbBriefcase2 className="inline" size={20}/> Closed</div>
                        </button>
                    </div>


                    <h2 className="font-bold text-xl mb-6" >{jobStatus === "open" ? `${listOfJobs.length} Open ${listOfJobs.length > 1 ? "Jobs" : "Job"}` : `${listOfJobs.length} Closed ${listOfJobs.length > 1 ? "Jobs" : "Job"}`}</h2>

                
                    {listOfJobs.length === 0 ?
                        <p className="text-center mt-20">There are no current job posts for this section</p>
                    :
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
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
                                                <div className="absolute top-4 right-4">
                                                    <IoEllipsisVertical 
                                                        onClick={() => {
                                                            setMenuID(eachJob.jobID)
                                                            setShowMenu(!showMenu)
                                                        }} 
                                                        size={20}
                                                    /> 
                                                                                                    
                                                    <div className={`w-25 bg-slate-100  p-1 absolute top-full right-0 rounded-md shadow-lg transition-opacity duration-150 ease-out ${(showMenu && menuID === eachJob.jobID) ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                                                        <PrimaryButton to={`/employer/jobs/viewJob/${eachJob.jobID}`} className="bg-slate-100 text-gray-600! font-semibold flex items-center gap-2">
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
                                                
                                                <h1 className="w-[85%] font-bold text-[1.1rem] text-[#111827] mb-2 ">{eachJob.jobTitle}</h1>
                                                <p className="flex items-center text-[#374151] gap-4 mb-1 justify-items-start"><GrLocation className="text-gray-500 w-5 shrink-0" /> {eachJob.location}</p>
                                                <p className="flex items-center text-[#374151] gap-4 mb-1"><MdGroups size={20} className="text-gray-500 w-5 shrink-0" /> {`${totalApplicants} ${totalApplicants.length > 1 ? "Applicants" : "Applicant"}`}</p>
                                                <p className="flex items-center text-[#374151] gap-4"><IoPersonOutline className="text-gray-500 w-5 shrink-0" /> {
                                                    eachJob.updatedAt > eachJob.createdAt 
                                                    ? `Updated by ${eachJob.updatedByFirstName} ${eachJob.updatedByLastName} on ${formatDate(eachJob.updatedAt)}`
                                                    : `Posted by ${eachJob.createdByFirstName} ${eachJob.createdByLastName} on ${formatDate(eachJob.createdAt)}`
                                                }</p>
                                                
                                                <div className="w-full mt-auto pt-10">
                                                    <PrimaryButton to={`/employer/jobs/${eachJob.jobID}/applicants`}>View Applicants</PrimaryButton>
                                                </div>
                                            </div>
                                        )
                                    } else {
                                        return (
                                            <div key={eachJob.jobID} className="relative w-full h-full flex flex-col rounded-2xl shadow-md bg-white p-6">
                                                <div className="absolute top-4 right-4">
                                                    <IoEllipsisVertical 
                                                        onClick={() => {
                                                            setMenuID(eachJob.jobID)
                                                            setShowMenu(!showMenu)
                                                        }} 
                                                        size={20}
                                                    /> 
                                                                                                    
                                                    <div className={`w-35 bg-slate-100  p-1 absolute top-full right-0 rounded-md shadow-lg transition-opacity duration-150 ease-out ${(showMenu && menuID === eachJob.jobID) ? "opacity-100" : "opacity-0"}`}>
                                                        <PrimaryButton to={`/employer/jobs/viewJob/${eachJob.jobID}`} className="bg-slate-100 text-gray-600! font-semibold flex items-center gap-2">
                                                            <AiOutlineEye />
                                                            View
                                                        </PrimaryButton>

                                                        <PrimaryButton onClick={() => showReOpenBox(eachJob.jobID)} className="bg-slate-100 text-green-600! font-semibold flex items-center gap-2">
                                                            <FaCheck />
                                                            Re-open
                                                        </PrimaryButton>

                                                        <PrimaryButton onClick={() => toggleDelete(eachJob.jobID)} className="bg-slate-100 text-red-600! px-0 font-semibold flex items-center gap-1">
                                                            <MdDelete size={20} />
                                                            Delete
                                                        </PrimaryButton>
                                                    </div>
                                                    
                                                </div>                                                
                                                <h1 className="font-bold text-[1.1rem] text-[#111827] mb-2 ">{eachJob.jobTitle}</h1>
                                                <p className="flex items-center text-[#374151] gap-4 mb-1 justify-items-start"><GrLocation className="text-gray-500 w-5 shrink-0" /> {eachJob.location}</p>
                                                <p className="flex items-center text-[#374151] gap-4 mb-1"><MdGroups size={20} className="text-gray-500 w-5 shrink-0" /> {`${totalApplicants} Applicants`}</p>
                                                <p className="flex items-center text-[#374151] gap-4"><IoPersonOutline className="text-gray-500 w-5 shrink-0" /> {
                                                    eachJob.updatedAt > eachJob.createdAt 
                                                    ? `Updated by ${eachJob.updatedByFirstName} ${eachJob.updatedByLastName} on ${formatDate(eachJob.updatedAt)}`
                                                    : `Posted by ${eachJob.createdByFirstName} ${eachJob.createdByLastName} on ${formatDate(eachJob.createdAt)}`
                                                }</p>
                                                
                                                <div className="w-full mt-auto pt-10">
                                                    <PrimaryButton className="w-full" onClick={() => viewApplicants(eachJob.jobID)}>View Applicants</PrimaryButton>
                                                    {/* <SecondaryButton to={`/employer/jobs/viewJob/${eachJob.jobID}`}>View</SecondaryButton> */}
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
            
            <Footer />
        </>
    );
}