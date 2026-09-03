import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import ApplicantSideBar from "../../components/navBars/ApplicantSideBar";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import DeleteItemBox from "../../components/popUps/DeleteItemBox"
import ConfirmationBox from "../../components/popUps/ConfirmationBox"
import { userStore } from "../../zustand/userState";
import { jobInfoStore, sideBarStore } from "../../zustand/stateHandlers";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaPaperPlane } from "react-icons/fa6";
import { FaListCheck } from "react-icons/fa6";
import { HiMiniVideoCamera } from "react-icons/hi2";
import { HiOutlineBriefcase } from "react-icons/hi";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { TbBriefcaseOff } from "react-icons/tb";
import { GrLocation } from "react-icons/gr";
import { FiBriefcase } from "react-icons/fi";
import { FiCalendar } from "react-icons/fi";
import { PiTarget } from "react-icons/pi";
import ReactPaginateModule from "react-paginate";
import useIsDesktop from "../../hooks/useIsDesktop";
import JobInfoSide from "../../components/popUps/JobInfoSide";
import api from "../../apis/axios";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";

export default function JobApplications() {
    const isDesktop = useIsDesktop();
    const ReactPaginate = ReactPaginateModule.default || ReactPaginateModule;
    const navigate = useNavigate();

    const { currentUser } = userStore();
    const { setApplicantActiveLink, sideBarStatus } = sideBarStore();
    useLockBodyScroll(sideBarStatus);
    
    const { 
        displayJob, 
        setDisplayJob, 
        jobInfo, 
        setJobInfo, 
        savedJobIDs, 
        setSavedJobIDs
    } = jobInfoStore();    


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

    const applicationsPerPage = 10;


    async function getApplications(page = 1) {
        try {
            const allApplications = await api.get("/applicant/applications", {
                params: { 
                    status,
                    page,
                    limit: applicationsPerPage
                }
            })
            // console.log(allApplications.data.applications)
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

    useEffect(() => {
        setApplicantActiveLink("Job Applications")
    }, [])

    function handlePageClick(event) {
        const selectedPage = event.selected + 1;
        getApplications(selectedPage);
    }

    async function withdrawApplication(applicationID) {
        try {
            await api.delete(`/applicant/withdrawApplication/${applicationID}`)
            setShowWarning(false);
            setOpenConfirm(true);
            setUpdated(!updated);
        } catch (error) {
            console.log(error);
        }
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
        if (!isDesktop) {
            navigate(`/applicant/viewJob/${jobID}`);
        }
    }


    return (
        <div className="lg:flex relative w-full">
            <ApplicantSideBar />
            <SideBarOverlay />
            <JobInfoSide display={displayJob} />

            <div className="w-full min-h-screen bg-[#F3F4F6] relative min-w-0">
                <AuthNavBar />

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

                <div className="sticky top-16 md:top-18 lg:top-24 lg:mt-2 z-20 lg:w-max lg:m-auto lg:rounded-full lg:shadow-lg">
                    <div className="flex gap-4  items-center px-6 py-4 bg-[#ECEFF3] overflow-x-auto scrollbar-none border-b border-gray-200 md:px-15 lg:px-5 lg:w-full lg:rounded-full lg:gap-2 xl:gap-4">
                        <PrimaryButton 
                            onClick={() => setStatus("submitted")} 
                            className={status === "submitted" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-white! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center lg:text-sm xl:text-[1rem]">
                                <FaPaperPlane className="lg:h-4 lg:w-4 xl:w-5 xl:h-5" size={20} />
                                Submitted
                            </span>
                        </PrimaryButton>

                        <PrimaryButton 
                            onClick={() => setStatus("shortlisted")}    
                            className={status === "shortlisted" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-white! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center lg:text-sm xl:text-[1rem]">
                                <FaListCheck className="lg:h-4 lg:w-4 xl:w-5 xl:h-5" size={20} />
                                Shortlisted
                            </span>
                        </PrimaryButton>
                        
                        <PrimaryButton 
                            onClick={() => setStatus("interview")}    
                            className={status === "interview" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-white! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center lg:text-sm xl:text-[1rem]">
                                <HiMiniVideoCamera className="lg:h-4 lg:w-4 xl:w-5 xl:h-5" size={20} />
                                Interview
                            </span>
                        </PrimaryButton>
                        
                        <PrimaryButton 
                            onClick={() => setStatus("hired")}
                            className={status === "hired" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-white! text-[#666666]!"}
                        >
                            <span className="flex gap-2 items-center justify-center lg:text-sm xl:text-[1rem]">
                                <HiOutlineBriefcase className="lg:h-4 lg:w-4 xl:w-5 xl:h-5" size={20} />
                                Job&nbsp;Offers
                            </span>
                        </PrimaryButton>
                        
                        <PrimaryButton 
                            onClick={() => setStatus("not selected")}
                            className={status === "not selected" ? "bg-[#10B981] px-4 border border-transparent transition-colors duration-200 ease-in" : "border border-[#E4E2DA] px-4 bg-white! text-[#666666]!"}
                        >
                            <span className="flex flex-row gap-2 items-center justify-center lg:text-sm xl:text-[1rem]">
                                <IoMdCloseCircleOutline className="lg:h-4 lg:w-4 xl:w-5 xl:h-5" size={20} />
                                Not&nbsp;selected
                            </span>
                        </PrimaryButton>
                        
                    </div>

                    <div className="lg:hidden pointer-events-none absolute left-0 top-0 h-full w-7 bg-linear-to-r from-white to-transparent md:w-20" />

                    <div className="lg:hidden pointer-events-none absolute right-0 top-0 h-full w-7 bg-linear-to-l from-white to-transparent md:w-20" />                    

                </div>

                <div className="w-full p-6 md:p-15 xl:px-30">
                    <section className="w-full text-sm text-center mb-5">
                        {
                            status === "submitted" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Submitted Applications</h1>
                                <p className="font-medium text-gray-700 text-sm md:text-[1rem]">View the applications you've successfully submitted to employers and track their progress.</p>
                            </>
                        }
                        {
                            status === "shortlisted" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Shortlisted Applications</h1>
                                <p className="font-medium text-gray-700 text-sm md:text-[1rem]">View applications where you've been shortlisted by employers for the next stage of the recruitment process.</p>
                            </>
                        }
                        {
                            status === "interview" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Interview Invitations</h1>
                                <p className="font-medium text-gray-700 text-sm md:text-[1rem]">View applications where you've been invited to the interview stage and stay updated on upcoming interview opportunities.</p>
                            </>
                        }
                        {
                            status === "hired" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Job Offers</h1>
                                <p className="font-medium text-gray-700 text-sm md:text-[1rem]">View job offers you've received from employers and stay updated on your latest opportunities.</p>
                            </>
                        }
                        {
                            status === "not selected" &&
                            <>
                                <h1 className="text-[22px] font-bold mb-3">Closed Applications</h1>
                                <p className="font-medium text-gray-700 text-sm md:text-[1rem]">View applications that were not successful and continue exploring new opportunities on WellMatch.</p>
                                
                            </>
                        }
                    </section>

                    {
                        jobs?.length === 0 ?
                            <section className="w-full mt-20 flex flex-col items-center gap-3 text-gray-500">
                                <TbBriefcaseOff className="xl:h-15 xl:w-15" size={45} />
                                <p className="text-sm xl:text-[16px] font-medium text-center">There are no current job applications in this section</p>                                
                            </section>
                        :
                            <section className="w-full flex flex-col gap-3 mt-10">
                                <p className="text-sm text-gray-500 font-medium md:text-[16px]">{`${totalApplications} job ${totalApplications > 1 ? "applications" : "application"}`}</p>

                                {
                                    jobs?.map((item) => (
                                        <div key={item.applicationID} className="p-6 w-full rounded-2xl shadow-md bg-white md:hidden">
                                            <div className="min-w-0 mb-7">
                                                <h2 className="font-bold mb-1 text-[16px] wrap-break-word">{item.jobTitle}</h2>
                                                <p className="text-gray-600 text-sm wrap-break-word">{item.companyName}</p>
                                            </div>

                                            {
                                                status === "hired" ?
                                                <>
                                                        <p className="text-gray-500 mb-2 text-sm flex items-center gap-2"><GrLocation size={18} />{item.location}</p>
                                                        <p className="text-gray-500 mb-2 text-sm flex items-center gap-2"><FiBriefcase size={18} />{item.workType}</p>
                                                        
                                                    </>
                                                :
                                                    <>
                                                        {item.overallScore !== null && <h2 className={`font-bold flex items-center gap-2 mb-2 text-sm ${item.overallScore >= 60 ? "text-green-600" : " text-red-600"} ${status !== "hired" ? "block" : "hidden"}`}><PiTarget />{`${item.overallScore}% Match`}</h2>}
                                                             
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
                                                <th className="px-6 py-4 text-center font-bold text-black w-35 max-w-48">Company</th>
                                                <th className="whitespace-nowrap px-6 py-4 text-center font-bold text-black">Submitted on</th>                                                
                                                {
                                                    status === "hired" ? 
                                                        <>
                                                           
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
                                                    <tr key={item.applicationID} className="border-t-2 border-gray-200 text-sm">
                                                        <td className="px-6 py-5 text-center w-48 max-w-48 wrap-break-word font-semibold">{item.jobTitle}</td>
                                                        <td className="px-6 py-5 text-center w-40 max-w-35 wrap-break-word">{item.companyName}</td>
                                                        <td className="whitespace-nowrap px-6 py-5 text-center">{new Date(item.applicationDate).toLocaleDateString('en-US', dateFormat)}</td>
                                                        {
                                                            status === "hired" ?
                                                                <>
                                    
                                                                    <td className="whitespace-nowrap px-6 py-5 text-center">{item.workType}</td>
                                                                    <td className="whitespace-nowrap px-6 py-5 text-center"><PrimaryButton to={`/applicant/viewJob/${item.jobID}/${item.resumeID}/skillGapReport`} className="rounded-md w-fit m-auto text-sm text-black! bg-green-300">See Report</PrimaryButton></td>
                                                                </>
                                                            :
                                                                <>
                                                                    {
                                                                        item.overallScore !== null ?
                                                                            <td className="whitespace-nowrap px-6 py-5 text-center">{item.overallScore}%</td>
                                                                        : item.concatJobSkills === null ?
                                                                            <td className="whitespace-nowrap px-6 py-5 text-center">Not Applicable</td>
                                                                        :   
                                                                            <td className="whitespace-nowrap px-6 py-5 text-center">Pending Analysis</td>
                                                                    }
                                                                    <td className="whitespace-nowrap px-6 py-5 text-center"><PrimaryButton to={`/applicant/viewJob/${item.jobID}/${item.resumeID}/skillGapReport`} className="rounded-md w-fit m-auto text-sm text-black! bg-green-300">See Report</PrimaryButton></td>
                                                                    {
                                                                        status === "not selected" ?
                                                                            <td className="whitespace-nowrap px-6 py-5 text-center">
                                                                                <PrimaryButton 
                                                                                    onClick={() => displayJobInfo(
                                                                                        item.jobID,
                                                                                        item.coverPhotoURL,
                                                                                        item.profilePhotoURL,
                                                                                        item.jobTitle,
                                                                                        item.companyName,
                                                                                        item.location,
                                                                                        item.workType,
                                                                                        item.workPlaceOption,
                                                                                        item.minSalary,
                                                                                        item.maxSalary,
                                                                                        item.jobOverview,
                                                                                        item.jobDuties,
                                                                                        item.requiredQualifications,
                                                                                        item.preferredQualifications,
                                                                                        item.workingConditions,
                                                                                        item.jobBenefits
                                                                                    )}
                                                                                    className="rounded-md w-fit m-auto text-sm px-6 text-black! bg-green-300"
                                                                                >
                                                                                    View
                                                                                </PrimaryButton>
                                                                            </td>
                                                                        :
                                                                            <td className="whitespace-nowrap px-6 py-5 text-center">
                                                                                <PrimaryButton 
                                                                                    onClick={() => {
                                                                                        setShowWarning(true);
                                                                                        setAppToWithdraw(item.applicationID)
                                                                                    }} 
                                                                                    className="rounded-md bg-red-600 m-auto text-sm "
                                                                                >
                                                                                    Withdraw
                                                                                </PrimaryButton>
                                                                            </td>
                                                                            
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

                            // Responsive page count
                            marginPagesDisplayed={isDesktop ? 2 : 1}
                            pageRangeDisplayed={isDesktop ? 3 : 1}

                            containerClassName="
                                flex
                                justify-center
                                items-center
                                gap-1
                                sm:gap-2
                                my-6
                                w-full
                            "

                            pageLinkClassName="
                                flex
                                items-center
                                justify-center
                                min-w-9
                                h-9
                                px-2
                                rounded-lg
                                text-sm
                                sm:min-w-10
                                sm:h-10
                                sm:px-4
                                sm:text-base
                                cursor-pointer
                                transition-colors
                                duration-200
                            "

                            activeLinkClassName="
                                bg-[#2B2B2B]
                                text-white
                            "

                            previousLinkClassName="
                                flex
                                items-center
                                justify-center
                                min-w-9
                                h-9
                                px-2
                                rounded-md
                                bg-white
                                shadow
                                text-sm
                                sm:min-w-10
                                sm:h-10
                                sm:px-4
                                sm:text-base
                                cursor-pointer
                                hover:bg-gray-100
                            "

                            nextLinkClassName="
                                flex
                                items-center
                                justify-center
                                min-w-9
                                h-9
                                px-2
                                rounded-md
                                bg-white
                                shadow
                                text-sm
                                sm:min-w-10
                                sm:h-10
                                sm:px-4
                                sm:text-base
                                cursor-pointer
                                hover:bg-gray-100
                            "

                            disabledClassName="
                                opacity-40
                                pointer-events-none
                            "
                        />
                    )}
                    
                </div>

            </div>

        </div>
    )
}