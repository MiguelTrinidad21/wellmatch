import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer"
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import DeleteItemBox from "../../components/popUps/DeleteItemBox"
import ConfirmationBox from "../../components/popUps/ConfirmationBox"
import { userStore } from "../../zustand/userState";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa6";
import { FaListCheck } from "react-icons/fa6";
import { HiMiniVideoCamera } from "react-icons/hi2";
import { HiOutlineBriefcase } from "react-icons/hi";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { TbBriefcaseOff } from "react-icons/tb";
import { GrLocation } from "react-icons/gr";
import { FiBriefcase } from "react-icons/fi";
import { FiCalendar } from "react-icons/fi";
import ReactPaginateModule from "react-paginate";

export default function JobApplications() {
    const ReactPaginate = ReactPaginateModule.default || ReactPaginateModule;
    const navigate = useNavigate();
    const { currentUser } = userStore();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);

    const [status, setStatus] = useState("submitted");
    const [jobs, setJobs] = useState([]);

    const [showWarning, setShowWarning] = useState(false);
    const [appToWithdraw, setAppToWithdraw] = useState(null);
    const [updated, setUpdated] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalApplications, setTotalApplications] = useState(0);

    const dateFormat = { year: 'numeric', month: 'long', day: 'numeric' };
    const activeStatus = ["submitted", "shortlisted", "interview"]

    const applicationsPerPage = 1;

    useEffect(() => {
        async function checkApplicant() {
            try {
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    return;
                }

                const result = await axios.get("/api/applicant/authorize", {
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
        if (!loading && !verified) {
            navigate("/forbidden", { replace: true });
        }
    }, [loading, verified, navigate]);

    async function getApplications(page = 1) {
        try {
            const allApplications = await axios.get("/api/applicant/applications", {
                params: { 
                    status,
                    page,
                    limit: applicationsPerPage
                },
                withCredentials: true
            })
            console.log(allApplications.data.pagination)
            setJobs(allApplications.data.applications);
            setTotalApplications(allApplications?.data?.pagination?.totalApplications);
            setTotalPages(allApplications?.data?.pagination?.totalPages);
            setCurrentPage(allApplications?.data?.pagination?.currentPage);
            
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {

        getApplications();

    }, [status, updated])

    function handlePageClick(event) {
        const selectedPage = event.selected + 1;
        getApplications(selectedPage);
    }

    async function withdrawApplication(applicationID) {
        try {
            await axios.delete(`/api/applicant/withdrawApplication/${applicationID}`, {
                withCredentials: true
            })
            setShowWarning(false);
            setOpenConfirm(true);
            setUpdated(!updated);
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
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />
                <Overlay />

                {
                    showWarning &&
                    <DeleteItemBox 
                        heading="Withdraw Application"
                        buttonText="Withdraw"
                        bodyText="Are you sure you want to withdraw this application?"
                        toggleFunction={() => setShowWarning(false)}
                        deleteFunction={() => withdrawApplication(appToWithdraw)}
                    />
                }
                {
                    openConfirm &&
                    <ConfirmationBox 
                        text="Application withdrawn successfully."
                        onClick={() => setOpenConfirm(false)}
                    />
                }

                <div className="fixed w-full">
                    <div className="flex gap-4 items-center px-6 py-4 bg-white overflow-x-auto scrollbar-none border-b border-[#E4E2DA] md:px-15">
                        <PrimaryButton 
                            onClick={() => setStatus("submitted")} 
                            className={status === "submitted" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center">
                                <FaPaperPlane size={20} />
                                Submitted
                            </span>
                        </PrimaryButton>

                        <PrimaryButton 
                            onClick={() => setStatus("shortlisted")}    
                            className={status === "shortlisted" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center">
                                <FaListCheck size={20} />
                                Shortlisted
                            </span>
                        </PrimaryButton>
                        
                        <PrimaryButton 
                            onClick={() => setStatus("interview")}    
                            className={status === "interview" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center">
                                <HiMiniVideoCamera size={20} />
                                Interview
                            </span>
                        </PrimaryButton>
                        
                        <PrimaryButton 
                            onClick={() => setStatus("hired")}
                            className={status === "hired" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center">
                                <HiOutlineBriefcase size={20} />
                                Hired
                            </span>
                        </PrimaryButton>
                        
                        <PrimaryButton 
                            onClick={() => setStatus("not selected")}
                            className={status === "not selected" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-[#F5F5F0]! text-[#666666]!"}
                        >
                            <span className="flex flex-row gap-2 items-center justify-center">
                                <IoMdCloseCircleOutline size={20} />
                                Not&nbsp;selected
                            </span>
                        </PrimaryButton>
                        
                    </div>

                    <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-linear-to-r from-[#F3F4F6] to-transparent md:w-20" />

                    <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-linear-to-l from-white to-transparent md:w-20" />                    

                </div>
                <Overlay />

                <div className="w-full p-6 md:p-15">
                    <section className="w-full text-center mb-5">
                        {
                            status === "submitted" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Your Submitted Applications</h1>
                                <p className="font-medium text-gray-700">Your applications have been sent to employers and are awaiting review.</p>
                            </>
                        }
                        {
                            status === "shortlisted" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Advancing Applications</h1>
                                <p className="font-medium text-gray-700">Your profile has impressed employers and is shortlisted for further review.</p>
                            </>
                        }
                        {
                            status === "interview" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Upcoming Interviews</h1>
                                <p className="font-medium text-gray-700">Employers may contact you soon. Prepare for the next stage. </p>
                            </>
                        }
                        {
                            status === "hired" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Hired Applications</h1>
                                <p className="font-medium text-gray-700">Congratulations! These are the applications that resulted in employment.</p>
                            </>
                        }
                        {
                            status === "not selected" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Closed Applications</h1>
                                <p className="font-medium text-gray-700">You weren’t selected for these roles — but keep improving and applying.</p>
                            </>
                        }
                    </section>

                    {
                        jobs?.length === 0 ?
                            <section className="w-full mt-20 flex flex-col items-center gap-3 text-gray-500">
                                <TbBriefcaseOff size={45} />
                                <p className="text-sm font-medium text-center">There are current job applications in this section</p>                                
                            </section>
                        :
                            <section className="w-full flex flex-col gap-3 mt-10">
                                <p className="text-sm text-gray-500 font-medium md:text-[16px]">{`${jobs.length} job ${jobs.length > 1 ? "applications" : "application"}`}</p>

                                {
                                    jobs?.map((item) => (
                                        <div key={item.applicationID} className="p-6 w-full rounded-2xl shadow-md bg-white md:hidden">
                                            <div className="flex justify-between gap-10">
                                                <div className="min-w-0 flex-1">
                                                    <h2 className="font-bold mb-1 text-[16px] wrap-break-word">{item.jobTitle}</h2>
                                                    <p className="text-gray-600 text-sm mb-7 wrap-break-word">{item.companyName}</p>
                                                </div>

                                                {
                                                    item.overallScore !== null && 
                                                    <div className={`shrink-0 p-1 rounded-md max-h-fit border ${item.overallScore >= 60 ? "bg-[#F0FDF4] border-green-400 text-green-600" : "bg-[#FFF1F2] border-red-600 text-red-600"} ${status !== "hired" ? "block" : "hidden"}`}>
                                                        <h2 className="font-bold text-[16px]">{`${item.overallScore}% Match`}</h2>
                                                    </div>
                                                }
                                            </div>

                                            {
                                                status === "hired" ?
                                                    <>
                                                        <p className="text-gray-500 mb-2 text-sm flex items-center gap-2"><GrLocation size={18} />{item.location}</p>
                                                        <p className="text-gray-500 mb-2 text-sm flex items-center gap-2"><FiBriefcase size={18} />{item.workType}</p>
                                                        <p className="text-gray-500 mb-10 text-sm flex items-center gap-2"><FiCalendar size={18} />{`Hired on ${new Date(item.dateHired).toLocaleDateString('en-US', dateFormat)}`}</p>
                                                    </>
                                                :
                                                    <>
                                                        <p className="text-gray-500 mb-2 text-sm flex items-center gap-2"><GrLocation size={18} />{item.location}</p>
                                                        <p className="text-gray-500 mb-10 text-sm flex items-center gap-2"><FiCalendar size={18} />{`Submitted on ${new Date(item.applicationDate).toLocaleDateString('en-US', dateFormat)}`}</p>
                                                    </>
                                            }                                            

                                            <div className={`flex ${activeStatus.includes(status) ? "justify-start" : "justify-end"} items-center gap-3`}>
                                                <PrimaryButton to={`/applicant/viewJob/${item.jobID}/${item.resumeID}/skillGapReport`} className="text-sm">See AI Report</PrimaryButton>
                                                {
                                                    activeStatus.includes(status) &&
                                                    <PrimaryButton onClick={() => {
                                                        setShowWarning(true);
                                                        setAppToWithdraw(item.applicationID)
                                                    }} className="bg-white text-red-600! text-sm">
                                                        Withdraw
                                                    </PrimaryButton>
                                                }
                                                
                                            </div>
                                        </div>
                                    ))
                                }

                                <div className="overflow-x-auto hidden md:block rounded-2xl shadow-lg border border-gray-200">
                                    <table className="min-w-max w-full border-collapse bg-white">
                                        <thead>
                                            <tr className="bg-gray-300/60">
                                                <th className="px-6 py-4 text-center font-bold text-black w-48 max-w-48">Job</th>
                                                <th className="px-6 py-4 text-center font-bold text-black whitespace-nowrap">Company</th>
                                                {
                                                    status === "hired" ? 
                                                        <>
                                                            <th className="whitespace-nowrap px-6 py-4 text-center font-bold text-black">Date Hired</th>
                                                            <th className="whitespace-nowrap px-6 py-4 text-center font-bold text-black">Work Type</th>
                                                            <th className="whitespace-nowrap px-6 py-4 text-center font-bold text-black">Skill Gap Analysis</th>
                                                        </>
                                                    :                                               
                                                        <>
                                                            <th className="whitespace-nowrap px-6 py-4 text-center font-bold text-black">Match Score</th>
                                                            <th className="whitespace-nowrap px-6 py-4 text-center font-bold text-black">Skill Gap Analysis</th>
                                                            {
                                                                status === "not selected" ?
                                                                    <th className="whitespace-nowrap px-6 py-4 text-center font-bold text-black">Job Description</th>                                    
                                                                :
                                                                    <th className="whitespace-nowrap px-6 py-4 text-center font-bold text-black">Action</th>
                                                            }   
                                                        </>
                                                }
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {
                                                jobs?.map((item) => (
                                                    <tr key={item.applicationID} className="border-t border-gray-200 text-sm">
                                                        <td className="px-6 py-5 text-center w-48 max-w-48 wrap-break-word font-semibold">{item.jobTitle}</td>
                                                        <td className="whitespace-nowrap px-6 py-5 text-center">{item.companyName}</td>
                                                        {
                                                            status === "hired" ?
                                                                <>
                                                                    <td className="whitespace-nowrap px-6 py-5 text-center">{new Date(item.dateHired).toLocaleDateString('en-US', dateFormat)}</td>
                                                                    <td className="whitespace-nowrap px-6 py-5 text-center">{item.workType}</td>
                                                                    <td className="whitespace-nowrap px-6 py-5 text-center"><PrimaryButton to={`/applicant/viewJob/${item.jobID}/${item.resumeID}/skillGapReport`} className="rounded-md m-auto text-sm text-black! bg-green-300">See Report</PrimaryButton></td>
                                                                </>
                                                            :
                                                                <>
                                                                    <td className="whitespace-nowrap px-6 py-5 text-center">{item.overallScore}%</td>
                                                                    <td className="whitespace-nowrap px-6 py-5 text-center"><PrimaryButton to={`/applicant/viewJob/${item.jobID}/${item.resumeID}/skillGapReport`} className="rounded-md m-auto text-sm text-black! bg-green-300">See Report</PrimaryButton></td>
                                                                    {
                                                                        status === "not selected" ?
                                                                            <td className="whitespace-nowrap px-6 py-5 text-center"><PrimaryButton to={`/applicant/viewJob/${item.jobID}`} className="rounded-md m-auto text-sm px-6 text-black! bg-green-300">View</PrimaryButton></td>
                                                                        :
                                                                            <td className="whitespace-nowrap px-6 py-5 text-center"><PrimaryButton className="rounded-md bg-red-600 m-auto text-sm ">Withdraw</PrimaryButton></td>
                                                                            
                                                                    }
                                                                </>
                                                        }
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </section>

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
                            containerClassName="flex justify-center items-center gap-4 mt-10 w-full"
                            pageLinkClassName="px-4 py-3 rounded-lg text-lg"
                            activeLinkClassName="bg-[#2B2B2B] text-white"
                            previousLinkClassName="px-4 py-2 rounded-md bg-white shadow"
                            nextLinkClassName="px-4 py-2 rounded-md bg-white shadow"
                            disabledClassName="opacity-40 cursor-not-allowed"
                        />
                    )}
                    
                </div>

            </div>
            <Footer />
        </>
    )
}