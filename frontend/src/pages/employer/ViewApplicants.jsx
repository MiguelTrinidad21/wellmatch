import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Loading from "../../components/others/Loading"
import Footer from "../../components/others/Footer"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import ConfirmationDialog from "../../components/popUps/ConfirmationDialog";
import WarningBox from "../../components/popUps/DeleteItemBox";
import { userStore } from "../../zustand/userState";
import { sideBarStore } from "../../zustand/stateHandlers";
import { useState, useEffect } from "react";
import { FaUserPlus } from "react-icons/fa6";;
import { FaListCheck } from "react-icons/fa6";
import { HiMiniVideoCamera } from "react-icons/hi2";
import { HiOutlineBriefcase } from "react-icons/hi";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { MdOutlineCancel } from "react-icons/md";
import { MdGroups } from "react-icons/md";
import { FaUsersSlash } from "react-icons/fa";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from 'date-fns';
import ReactPaginateModule from "react-paginate";

export default function ViewApplicants() {
    const ReactPaginate = ReactPaginateModule.default || ReactPaginateModule;

    const navigate = useNavigate();
    const { jobID } = useParams();
    const { currentUser } = userStore();
    const { setEmployerActiveLink } = sideBarStore();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);

    const [status, setStatus] = useState("submitted");
    const [applicationID, setApplicationID] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalApplicants, setTotalApplicants] = useState(0);
    const [applicantList, setApplicantList] = useState([]);

    const [showRejectAll, setShowRejectAll] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [jobTitle, setJobTitle] = useState("");

    const activeStatus = ["submitted", "shortlisted", "interview"]
    const dateFormat = { year: 'numeric', month: 'long', day: 'numeric' };
    
    const applicantsPerPage = 5;

    async function fetchApplicants(page = 1, status) {
        setStatus(status);

        try {
            const res = await axios.get(`/api/employer/fetchApplicants`, {
                params: {
                    jobID,
                    status,
                    page,
                    limit: applicantsPerPage
                },
                withCredentials: true
            });

            // console.log(res.data.allApplicants)

            setJobTitle(res?.data?.jobTitle);
            setApplicantList(res?.data?.allApplicants);
            setTotalApplicants(res?.data?.pagination?.totalApplicants);
            setTotalPages(res?.data?.pagination?.totalPages);
            setCurrentPage(res?.data?.pagination?.currentPage);
        } catch (error) {
            console.log(error);
        }
    }

    async function updateStatus(applicationID, currentStatus, nextStatus) {
        try {
            await axios.patch("/api/employer/updateApplicationStatus",
                {applicationID, nextStatus},
                {withCredentials: true}
            );
            
            setShowConfirm(false);
            fetchApplicants(currentPage, currentStatus);

        } catch (error) {
            console.log(error);
        }
    }

    async function rejectApplicant(applicationID, currentStatus) {
        try {
            await axios.patch("/api/employer/rejectApplicant", 
                { applicationID },
                { withCredentials: true }
            );

            setShowReject(false);
            fetchApplicants(currentPage, currentStatus);
            
        } catch (error) {
            console.log(error);
        }
    }

    async function rejectAllApplicants(currentStatus) {
        try {
            await axios.patch("/api/employer/applications/rejectAll",
                {currentStatus},
                {withCredentials: true}
            );

            setShowRejectAll(false);
            fetchApplicants(1, currentStatus);
            
        } catch (error) {
            console.log(error);
        }
    }


    function handlePageClick(event) {
        const selectedPage = event.selected + 1;
        fetchApplicants(selectedPage);
    }
    
    useEffect(() => {
        setEmployerActiveLink("applicants")
    }, [])

    useEffect(() => {
        async function checkApplicant() {
            try {
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

        checkApplicant();
    }, [currentUser]);


    useEffect(() => {
        fetchApplicants(1, "submitted"); 
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
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />
                <Overlay />

                {
                    showRejectAll &&
                    <WarningBox 
                        heading="Reject all applicants?"
                        bodyText="All active applicants for in this section will be marked as Not Selected. This action cannot be undone."
                        buttonText="Reject all"
                        toggleFunction={() => setShowRejectAll(false)}
                        deleteFunction={() => rejectAllApplicants(status)}
                    />
                }

                {
                    showReject &&
                    <WarningBox 
                        heading="Reject Applicant?"
                        bodyText="This applicant will be marked as Not Selected and removed from the active hiring process. This action cannot be undone."
                        buttonText="Reject"
                        toggleFunction={() => setShowReject(false)}
                        deleteFunction={() => rejectApplicant(applicationID, status)}
                    />
                }

                {
                    (showConfirm && status === "submitted") &&
                    <ConfirmationDialog 
                        heading="Shorlist Applicant?"
                        bodyText="This applicant will be moved to the Shortlisted stage, making it easier to review and compare with other promising candidates."
                        toggleFunction={() => setShowConfirm(false)}
                        confirmFunction={() => updateStatus(applicationID, status, "shortlisted")}
                    />
                }

                {
                    (showConfirm && status === "shortlisted") &&
                    <ConfirmationDialog 
                        heading="Move to Interview?"
                        bodyText="This applicant will be moved to the Interview stage for further evaluation."
                        toggleFunction={() => setShowConfirm(false)}
                        confirmFunction={() => updateStatus(applicationID, status, "interview")}
                    />
                }

                {
                    (showConfirm && status === "interview") &&
                    <ConfirmationDialog 
                        heading="Hire Applicant?"
                        bodyText="This applicant will be marked as Hired, completing their hiring process for this job. This action cannot be undone."
                        toggleFunction={() => setShowConfirm(false)}
                        confirmFunction={() => updateStatus(applicationID, status, "hired")}
                    />
                }

                
                <div className="fixed w-full">
                    <div className="flex gap-4 items-center px-6 py-4 bg-white overflow-x-auto scrollbar-none border-b border-[#E4E2DA] md:px-15">
                        <PrimaryButton 
                            onClick={() => fetchApplicants(1, "submitted")} 
                            className={status === "submitted" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center">
                                <FaUserPlus size={20} />
                                New
                            </span>
                        </PrimaryButton>

                        <PrimaryButton 
                            onClick={() => fetchApplicants(1, "shortlisted")}    
                            className={status === "shortlisted" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center">
                                <FaListCheck size={20} />
                                Shortlisted
                            </span>
                        </PrimaryButton>
                        
                        <PrimaryButton 
                            onClick={() => fetchApplicants(1, "interview")}    
                            className={status === "interview" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center">
                                <HiMiniVideoCamera size={20} />
                                Interview
                            </span>
                        </PrimaryButton>
                        
                        <PrimaryButton 
                            onClick={() => fetchApplicants(1, "hired")}
                            className={status === "hired" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center">
                                <HiOutlineBriefcase size={20} />
                                Hired
                            </span>
                        </PrimaryButton>
                        
                        <PrimaryButton 
                            onClick={() => fetchApplicants(1, "not selected")}
                            className={status === "not selected" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex flex-row gap-2 items-center justify-center">
                                <IoMdCloseCircleOutline size={20} />
                                Past&nbsp;Applicants
                            </span>
                        </PrimaryButton>
                        
                    </div>
                </div>
                <Overlay />

                <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-linear-to-r from-[#F3F4F6] to-transparent md:w-20" />

                <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-linear-to-l from-white to-transparent md:w-20" />                  

                {
                    jobID === "selectFirst" ?
                        <div className="w-full absolute top-1/2 -translate-y-1/2 flex flex-col gap-2 items-center">
                            <MdGroups className="text-gray-500" size={45} />
                            <p className="text-gray-500">Select a job to see the list of its applicants</p>
    
                            <PrimaryButton to="/employer/jobs">Select a job</PrimaryButton>
                        </div>
                    :
                        <div className="w-full p-6 md:py-10 md:px-15">
                            {
                                status === "submitted" &&
                                <>
                                    <h1 className="font-bold text-2xl mb-2 text-center">New Applicants</h1>
                                    <p className="text-gray-600 text-center font-semibold mb-10">Review newly submitted applications and decide which candidates to move forward.</p>                                
                                </>
                            }
                            {
                                status === "shortlisted" &&
                                <>
                                    <h1 className="font-bold text-2xl mb-2 text-center">Shortlisted Applicants</h1>
                                    <p className="text-gray-600 text-center font-semibold mb-10">Compare your shortlisted candidates and select who to invite for the next stage.</p>                                
                                </>
                            }
                            {
                                status === "interview" &&
                                <>
                                    <h1 className="font-bold text-2xl mb-2 text-center">Interview Candidates</h1>
                                    <p className="text-gray-600 text-center font-semibold mb-10">Manage applicants currently in the interview stage and track their progress.</p>                                
                                </>
                            }
                            {
                                status === "hired" &&
                                <>
                                    <h1 className="font-bold text-2xl mb-2 text-center">Hired Applicants</h1>
                                    <p className="text-gray-600 text-center font-semibold mb-10">View applicants who have successfully accepted or secured the position.</p>                                
                                </>
                            }
                            {
                                status === "not selected" &&
                                <>
                                    <h1 className="font-bold text-2xl mb-2 text-center">Past Applicants</h1>
                                    <p className="text-gray-600 text-center font-semibold mb-10">View applications that are no longer active, including rejected and withdrawn applicants.</p>                                
                                </>
                            }


                            {
                                applicantList.length === 0 ?
                                <div className="w-full flex flex-col items-center gap-3 mt-10 text-gray-500">
                                    <FaUsersSlash size={45} />
                                    <p>There are no applicants in this section</p>
                                </div>
                            :   
                                <div className="w-full">

                                    <div className="mb-8 border-l-4 border-green-600 pl-3 py-4 ">
                                        <p className="text-sm text-green-700 font-semibold">APPLICANTS FOR</p>
                                        <p className="font-bold">{jobTitle}</p>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-gray-500">{`${applicantList.length} ${applicantList.length > 1 ? "applicants" : "applicant"}`}</p>
                                        {
                                            activeStatus.includes(status) &&
                                            <PrimaryButton 
                                                onClick={() => setShowRejectAll(true)}
                                                className="text-sm flex items-center gap-1 rounded-md bg-red-600 shadow-md"
                                            >
                                                <MdOutlineCancel size={20} />
                                                Reject all
                                            </PrimaryButton>
                                        }
                                    </div>
                                    
                                    <div className="w-full flex flex-col gap-3">
                                        {
                                            applicantList?.map((item) => (
                                                <div key={item.applicationID} className="w-full rounded-2xl shadow-md bg-white p-4 md:hidden">
                                                    <div className="flex justify-between gap-10">
                                                        <div className="flex-1 min-w-0">
                                                            <h1 className="font-bold text-xl mb-1">{`${item.firstName} ${item.lastName}`}</h1>
                                                            
                                                        </div>

                                                        {status === "not selected" ?
                                                            <div className="shrink-0 bg-red-50 p-1 rounded-md max-h-fit border border-red-400">
                                                                <h2 className="font-bold text-[16px] text-red-600">{item.status === "not selected" ? "Rejected" : "Withdrew"}</h2>
                                                            </div>
                                                        :
                                                            <div className={`shrink-0 p-1 rounded-md max-h-fit border ${item.overallScore <= 60 ? "bg-[#FFF1F2] border-red-600 text-red-600" : "bg-[#F0FDF4] border-green-400 text-green-600"}`}>
                                                                {
                                                                    item.overallScore ?
                                                                        <h2 className="font-bold text-[16px]">{`${item.overallScore}% Match`}</h2>
                                                                    :
                                                                        <h2 className="font-bold text-sm text-green-600">Awaiting review</h2>
                                                                }
                                                            </div>  
                                                        }
            
                                                                                            
                                                    </div>
                                                    {
                                                        status === "hired" ?
                                                            <p className="text-gray-500 mb-10 text-sm">{`Hired on ${new Date(item.dateHired).toLocaleDateString('en-US', dateFormat)}`}</p>
                                                        :
                                                            <p className="text-gray-500 mb-10 text-sm">{`Submitted on ${new Date(item.applicationDate).toLocaleDateString('en-US', dateFormat)}`}</p>
                                                    }
            
                                                    <div className="flex justify-between text-sm">
                                                        <PrimaryButton to={`/employer/applications/skillGapReport/${item.applicantID}/${item.jobID}/${item.resumeID}`} >View Profile</PrimaryButton>
                                                        {
                                                            status === "submitted" &&
                                                            <div className="flex gap-4">
                                                                <PrimaryButton 
                                                                    onClick={() => {
                                                                        setApplicationID(item.applicationID)
                                                                        setShowReject(true)
                                                                    }} 
                                                                    className="text-red-600! bg-white px-0!"
                                                                >
                                                                    Reject
                                                                </PrimaryButton>

                                                                <PrimaryButton 
                                                                    onClick={() => {
                                                                        setApplicationID(item.applicationID)
                                                                        setShowConfirm(true)
                                                                    }} 
                                                                    className="text-green-600! bg-white px-0!"
                                                                >
                                                                    Interested
                                                                </PrimaryButton>
                                                            </div>
                                                        }
                                                        {
                                                            status === "shortlisted" &&
                                                            <div className="flex gap-4">
                                                                <PrimaryButton 
                                                                    onClick={() => {
                                                                        setApplicationID(item.applicationID)
                                                                        setShowReject(true)
                                                                    }} 
                                                                    className="text-red-600! bg-white px-0!"
                                                                >
                                                                    Reject
                                                                </PrimaryButton>

                                                                <PrimaryButton 
                                                                    onClick={() => {
                                                                        setApplicationID(item.applicationID)
                                                                        setShowConfirm(true)
                                                                    }} 
                                                                    className="text-green-600! bg-white px-0!"
                                                                >
                                                                    Interview
                                                                </PrimaryButton>
                                                            </div>
                                                        }
                                                        {
                                                            status === "interview" &&
                                                            <div className="flex gap-4">
                                                                <PrimaryButton 
                                                                    onClick={() => {
                                                                        setApplicationID(item.applicationID)
                                                                        setShowReject(true)
                                                                    }} 
                                                                    className="text-red-600! bg-white px-0!"
                                                                >
                                                                    Reject
                                                                </PrimaryButton>

                                                                <PrimaryButton 
                                                                    onClick={() => {
                                                                        setApplicationID(item.applicationID)
                                                                        setShowConfirm(true)
                                                                    }} 
                                                                    className="text-green-600! bg-white px-0!"
                                                                >
                                                                    Hire
                                                                </PrimaryButton>
                                                            </div>
                                                        }
                                                    </div>
                                                </div>
                                            ))
                                        }

                                        <div className="overflow-x-auto hidden md:block rounded-2xl shadow-lg border border-gray-200">
                                            <table className="min-w-max w-full border-collapse bg-white">
                                                <thead>
                                                    <tr className="bg-gray-300/60">
                                                        <th className="px-6 py-4 text-center font-bold text-black w-48 max-w-48">Name</th>
                                                        <th className="px-6 py-4 text-center font-bold text-black w-48 max-w-48">Submitted on</th>
                                                        <th className="px-6 py-4 text-center font-bold text-black w-48 max-w-48">Match Score</th>
                                                        <th className="px-6 py-4 text-center font-bold text-black w-48 max-w-48">Skill Gap Analysis</th>
                                                        {
                                                            status === "hired" ? <th className="px-6 py-4 text-center font-bold text-black w-48 max-w-48">Date Hired</th> 
                                                          : status === "not selected" ? <th className="px-6 py-4 text-center font-bold text-black w-48 max-w-48">Status</th>
                                                          : <th className="px-6 py-4 text-center font-bold text-black w-48 max-w-48">Actions</th>
                                                        }
                                                    </tr>
                                                </thead>
                                                
                                                <tbody>
                                                    {
                                                        applicantList?.map((item) => (
                                                            <tr key={item.applicationID} className="border-t border-gray-200 text-sm">
                                                                <td className="px-6 py-5 text-center w-48 max-w-48 wrap-break-word font-semibold">{`${item.firstName} ${item.lastName}`}</td>
                                                                <td className="px-6 py-5 text-center w-48 max-w-48 wrap-break-word font-semibold">{new Date(item.applicationDate).toLocaleDateString('en-US', dateFormat)}</td>
                                                                <td className="px-6 py-5 text-center w-48 max-w-48 wrap-break-word font-semibold">{item.overallScore}%</td>
                                                                <td className="px-6 py-5 text-center w-48 max-w-48 wrap-break-word font-semibold ">
                                                                    <PrimaryButton to={`/employer/applications/skillGapReport/${item.applicantID}/${item.jobID}/${item.resumeID}`} className="m-auto rounded-md text-sm">See Report</PrimaryButton>
                                                                </td>
                                                                {status === "submitted" &&
                                                                    <td className="flex items-center justify-center gap-3">
                                                                        <PrimaryButton
                                                                            onClick={() => {
                                                                                setApplicationID(item.applicationID)
                                                                                setShowConfirm(true)
                                                                            }} 
                                                                            className="text-green-600! text-sm bg-white px-0!"                                        
                                                                        >
                                                                            Interested
                                                                        </PrimaryButton>

                                                                        <PrimaryButton 
                                                                            onClick={() => {
                                                                                setApplicationID(item.applicationID)
                                                                                setShowReject(true)
                                                                            }} 
                                                                            className="text-red-600! bg-white px-0!"
                                                                        >
                                                                            Reject
                                                                        </PrimaryButton>                                                                        
                                                                    </td>
                                                                }

                                                                {status === "shortlisted" &&
                                                                    <td className="flex items-center justify-center gap-3">
                                                                        <PrimaryButton 
                                                                            onClick={() => {
                                                                                setApplicationID(item.applicationID)
                                                                                setShowConfirm(true)
                                                                            }} 
                                                                            className="text-green-600! bg-white px-0!"
                                                                        >
                                                                            Interview
                                                                        </PrimaryButton>
                                                                        <PrimaryButton 
                                                                            onClick={() => {
                                                                                setApplicationID(item.applicationID)
                                                                                setShowReject(true)
                                                                            }} 
                                                                            className="text-red-600! bg-white px-0!"
                                                                        >
                                                                            Reject
                                                                        </PrimaryButton>

                                                                    </td>                                                                
                                                                }

                                                                {status === "interview" &&
                                                                    <td className="flex items-center justify-center gap-3">
                                                                        <PrimaryButton 
                                                                            onClick={() => {
                                                                                setApplicationID(item.applicationID)
                                                                                setShowConfirm(true)
                                                                            }} 
                                                                            className="text-green-600! bg-white px-0!"
                                                                        >
                                                                            Hire
                                                                        </PrimaryButton>
                                                                        <PrimaryButton 
                                                                            onClick={() => {
                                                                                setApplicationID(item.applicationID)
                                                                                setShowReject(true)
                                                                            }} 
                                                                            className="text-red-600! bg-white px-0!"
                                                                        >
                                                                            Reject
                                                                        </PrimaryButton>

                                                                    </td>                                                                
                                                                }
                                                                {status === "hired" && <td className="px-6 py-5 text-center w-48 max-w-48 wrap-break-word font-semibold">{new Date(item.dateHired).toLocaleDateString('en-US', dateFormat)}</td>}
                                                                {status === "not selected" && <td className="px-6 py-5 text-center w-48 max-w-48 wrap-break-word font-semibold">{item.status === "not selected" ? "Rejected" : "Withdrew"}</td>}
                                                                
                                                                
                                                            </tr>
                                                        ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            }

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
                }

                
            </div>

            <Footer />
        </>
    )
}