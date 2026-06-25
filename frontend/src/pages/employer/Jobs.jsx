import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Loading from "../../components/others/Loading"
import Footer from "../../components/others/Footer"
import WarningBox from "../../components/popUps/WarningBox";
import Translucent from "../../components/overlay/Translucent";
import { userStore } from "../../zustand/userState";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TbBriefcase2 } from "react-icons/tb";
import { GrLocation } from "react-icons/gr";
import { MdGroups } from "react-icons/md";
import { IoPersonOutline } from "react-icons/io5";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton"

export default function Jobs() {
    const { currentUser } = userStore();
    const navigate = useNavigate();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [jobStatus, setJobStatus] = useState("open");
    const [listOfJobs, setListOfJobs] = useState([]);

    const [applicantList, setApplicantList] = useState([]);

    const [isJobToClose, setIsJobToClose] = useState("");
    const [isJobClosing, setIsJobClosing] = useState(false)
    const [closingError, setClosingError] = useState("");
    const [jobHasClosed, setJobHasClosed] = useState(false);
    const [closingJobID, setClosingJobID] = useState(null);


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
    }, [jobStatus, jobHasClosed])

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
    }

    async function closeJob() {
        setIsJobClosing(true);
        setJobHasClosed(false)

        try {
            axios.patch(`/api/employer/job/close/${closingJobID}`, 
                { withCredentials: true }
            )

            setJobHasClosed(true);
            setIsJobToClose(!isJobToClose)
            setJobStatus("closed")
        } catch (error) {
            console.log(error)
            setClosingError("Closing job failed. Please try again")
        } finally {
            setIsJobClosing(false);

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
            <div className="w-full min-h-screen bg-[#F3F4F6] relative p-6">
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

                <h1 className="font-bold text-2xl mb-2">Company Job Posts</h1>
                <p className="text-gray-500 mb-4">Manage your company's job posts</p>

                <div className="grid grid-cols-2 w-full rounded-xl shadow-md mb-6">
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


                <h2 className="font-bold text-xl mb-6" >{jobStatus === "open" ? `${listOfJobs.length} Open Jobs` : `${listOfJobs.length} Closed Jobs`}</h2>

                <div className="w-full flex flex-col gap-6">
                    {listOfJobs.length === 0 ? (
                        <p className="text-center">There are no current job posts for this section</p>
                    ) :
                    (listOfJobs.map((eachJob) => {
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
                                <div key={eachJob.jobID} className="w-full rounded-2xl shadow-md bg-white p-6">
                                    <h1 className="font-bold text-[1.1rem] text-[#111827] mb-2 ">{eachJob.jobTitle}</h1>
                                    <p className="flex items-center text-[#374151] gap-4 mb-1 justify-items-start"><GrLocation className="text-gray-500 w-5 shrink-0" /> {eachJob.location}</p>
                                    <p className="flex items-center text-[#374151] gap-4 mb-1"><MdGroups size={20} className="text-gray-500 w-5 shrink-0" /> {`${totalApplicants} Applicants`}</p>
                                    <p className="flex items-center text-[#374151] gap-4"><IoPersonOutline className="text-gray-500 w-5 shrink-0" /> {
                                        eachJob.updatedAt > eachJob.createdAt 
                                        ? `Updated by ${eachJob.updatedByFirstName} ${eachJob.updatedByLastName} on ${formatDate(eachJob.updatedAt)}`
                                        : `Posted by ${eachJob.createdByFirstName} ${eachJob.createdByLastName} on ${formatDate(eachJob.createdAt)}`
                                    }</p>
                                    
                                    <div className="w-full flex justify-between mt-10">
                                        <PrimaryButton to={`/employer/jobs/${eachJob.jobID}/applicants`} className="text-[12px]">View Applicants</PrimaryButton>
                                        <div className="flex gap-2">
                                            <PrimaryButton onClick={() => toggleWarning(eachJob.jobID)} className="text-gray-700! text-[13px] bg-white">Close</PrimaryButton>
                                            <SecondaryButton to={`/employer/jobs/${eachJob.jobID}/edit`} className=" px-5 font-semibold">Edit</SecondaryButton>
                                        </div>
                                    </div>
                                </div>
                            )
                        } else {
                            return (
                                <div key={eachJob.jobID} className="w-full rounded-2xl shadow-md bg-white p-6">
                                    <h1 className="font-bold text-[1.1rem] text-[#111827] mb-2 ">{eachJob.jobTitle}</h1>
                                    <p className="flex items-center text-[#374151] gap-4 mb-1 justify-items-start"><GrLocation className="text-gray-500 w-5 shrink-0" /> {eachJob.location}</p>
                                    <p className="flex items-center text-[#374151] gap-4 mb-1"><MdGroups size={20} className="text-gray-500 w-5 shrink-0" /> {`${totalApplicants} Applicants`}</p>
                                    <p className="flex items-center text-[#374151] gap-4"><IoPersonOutline className="text-gray-500 w-5 shrink-0" /> {
                                        eachJob.updatedAt > eachJob.createdAt 
                                        ? `Updated by ${eachJob.updatedByFirstName} ${eachJob.updatedByLastName} on ${formatDate(eachJob.updatedAt)}`
                                        : `Posted by ${eachJob.createdByFirstName} ${eachJob.createdByLastName} on ${formatDate(eachJob.createdAt)}`
                                    }</p>
                                    
                                    <div className="w-full flex justify-between mt-10">
                                        <PrimaryButton to={`/employer/jobs/${eachJob.jobID}/applicants`} className="text-[12px]">View Applicants</PrimaryButton>
                                        {/* <div className="flex gap-2">
                                            <PrimaryButton onClick={() => toggleWarning(eachJob.jobID)} className="text-gray-700! text-[13px] bg-white">Close</PrimaryButton>
                                            <SecondaryButton to={`/employer/jobs/${eachJob.jobID}/edit`} className=" px-5 font-semibold">Edit</SecondaryButton>
                                        </div> */}
                                    </div>
                                </div>
                            )
                        }
                    }))}
                </div>
            </div>
            
            <Footer />
        </>
    );
}