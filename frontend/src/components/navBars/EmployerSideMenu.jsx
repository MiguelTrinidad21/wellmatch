import { RxAvatar } from "react-icons/rx";
import { FiBriefcase } from "react-icons/fi";
import { FaList } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { MdOutlineLogout } from "react-icons/md";
import { FaPlus } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { sideBarStore, jobCreationStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";
import { companyStore } from "../../zustand/stateHandlers";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PrimaryButton from "../buttons/PrimaryButton";
import defaultCover from "../../assets/defaultCover.jpg"
import axios from "axios";

export default function EmployerSideMenu({ status }) {
    const { toggleSideBar, employerActiveLink, setEmployerActiveLink } = sideBarStore();
    const { clearCreatedJob } = jobCreationStore();
    const { currentUser, logoutUser } = userStore();
    const { companyInfo, setCompanyInfo } = companyStore();
    const navigate = useNavigate();
    
    async function logoutEmployer() {
        try {
            await axios.post("/api/employer/logout", {}, {
                withCredentials: true
            })
            toggleSideBar()
            logoutUser();
            setEmployerActiveLink("Jobs")
            navigate("/employer/login");

        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {

        async function fetchCompany() {
            try {
                const result = await axios.get("/api/employer/company", {
                    params: {
                        companyID: currentUser.companyID
                    },
                    withCredentials: true
                });
                setCompanyInfo(result.data);

            } catch (error) {
                console.error(error);
            }
        }

        fetchCompany();
    }, [currentUser?.companyID])


    return (
        <>
            <div onClick={toggleSideBar} className={`fixed inset-0 z-30 bg-gray-800/50 transition-opacity duration-300 ${status ? "opacity-100 visible" : "opacity-0 invisible"}`}></div>
            <aside className={`p-5 pt-7 fixed top-0 right-0 ${status ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-out w-[70%] h-full z-40 bg-[#F9FAFB] md:w-[50%] md:p-10`}>
                <div className="absolute top-3 right-3 bg-[#D7F1E0] p-2 rounded-full" >
                    <IoClose size={25} onClick={toggleSideBar} />
                </div>

                <div className="w-full">
                    <div className="w-25 h-25 m-auto mt-7 mb-3 rounded-lg">
                        <img className="w-full h-full object-cover rounded-lg" src={companyInfo.profilePhotoURL ? `${companyInfo.profilePhotoURL}` : defaultCover} alt="Company Logo" />
                    </div>
                    <div className="font-bold text-center text-xl mb-1">{currentUser.firstName}&nbsp;{currentUser.lastName}</div>
                    <div className="font-medium text-center mb-3">{companyInfo.companyName}</div>
                    <hr className="h-px bg-gray-300 border-none mb-3"/>

                    <div onClick={() => setEmployerActiveLink("Jobs")} className={`mb-2 rounded-xl py-2.25 px-2.5 ${employerActiveLink === "Jobs" ? "bg-[#D7F1E0]" : "hover:bg-[#D7F1E0] transition-colors duration-200 ease-in"}`}>
                        <Link className="flex gap-3 items-center md:gap-5" to="/employer/jobs" onClick={toggleSideBar}>
                            <span className={`rounded-xl p-2 ${employerActiveLink === "Jobs" ? "bg-[#109D5C] text-white" : "text-green-700 bg-[#D7F1E0]"}`}>
                                <FiBriefcase />
                            </span>
                            <span className={`${employerActiveLink === "Jobs" ? "font-bold" : "font-mediun"}`}>Jobs</span>
                            
                        </Link>
                    </div>                    

                    <div onClick={() => setEmployerActiveLink("Applicants")} className={`mb-2 rounded-xl py-2.25 px-2.5 ${employerActiveLink === "Applicants" ? "bg-[#D7F1E0]" : "hover:bg-[#D7F1E0] transition-colors duration-200 ease-in"}`}>
                        <Link className="flex gap-3 items-center md:gap-5" to="/employer/jobs/selectFirst/applicants" onClick={toggleSideBar}>
                            <span className={`rounded-xl p-2 ${employerActiveLink === "Applicants" ? "bg-[#109D5C] text-white" : "text-green-700 bg-[#D7F1E0]"}`}>
                                <FaList />
                            </span>
                            <span className={`${employerActiveLink === "Applicants" ? "font-bold" : "font-mediun"}`}>Applicants</span>                        
                        </Link>
                    </div>

                    <div onClick={() => setEmployerActiveLink("Company Profile")} className={`mb-2 rounded-xl py-2.25 px-2.5 ${employerActiveLink === "Company Profile" ? "bg-[#D7F1E0]" : "hover:bg-[#D7F1E0] transition-colors duration-200 ease-in"}`}>
                        <Link className="flex gap-3 items-center md:gap-5" to="/employer/companyProfile" onClick={toggleSideBar}>
                            <span className={`rounded-xl p-2 ${employerActiveLink === "Company Profile" ? "bg-[#109D5C] text-white" : "text-green-700 bg-[#D7F1E0]"}`}>
                                <RxAvatar size={17} />
                            </span>
                            <span className={`${employerActiveLink === "Company Profile" ? "font-bold" : "font-mediun"}`}>Company Profile</span>                           
                        </Link>
                    </div>

                    <div onClick={() => setEmployerActiveLink("Account Settings")} className={`rounded-xl py-2.25 px-2.5 ${employerActiveLink === "Account Settings" ? "bg-[#D7F1E0]" : "hover:bg-[#D7F1E0] transition-colors duration-200 ease-in"}`}>
                        <Link className="flex gap-3 items-center md:gap-5" to="/employer/settings" onClick={toggleSideBar}>
                            <span className={`rounded-xl p-2 ${employerActiveLink === "Account Settings" ? "bg-[#109D5C] text-white" : "text-green-700 bg-[#D7F1E0]"}`}>
                                <FaGear />
                            </span>
                            <span className={`${employerActiveLink === "Account Settings" ? "font-bold" : "font-mediun"}`}>Account Settings</span>                    
                        </Link>
                    </div>                    
                    
                    <hr className="h-px bg-gray-300 border-none my-4"/>
                    <PrimaryButton onClick={() => {
                        clearCreatedJob();
                        toggleSideBar();
                    }} className="w-full block text-center rounded-lg">
                        <Link className="flex gap-3 items-center justify-center md:gap-5" to="/employer/createJob">
                            <FaPlus />
                            Create Job Post
                        </Link>
                    </PrimaryButton>
                </div>    
                <button onClick={logoutEmployer} className="mt-7 text-red-600 font-bold text-lg"><MdOutlineLogout className="inline mr-4" />Log out</button>
            </aside>
        </>
    )
}