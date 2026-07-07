import { RxAvatar } from "react-icons/rx";
import { MdOutlineHome } from "react-icons/md";
import { FaBookmark } from "react-icons/fa6";
import { FaList } from "react-icons/fa";
import { VscGear } from "react-icons/vsc";
import { MdOutlineLogout } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { sideBarStore, jobCreationStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PrimaryButton from "../buttons/PrimaryButton";
import defaultProfile from "../../assets/defaultProfile.jpg"
import axios from "axios";

export default function ApplicantSideMenu({ status }) {
    const { toggleSideBar, applicantActiveLink, setApplicantActiveLink } = sideBarStore();
    const { clearCreatedJob } = jobCreationStore();
    const { currentUser, logoutUser } = userStore();
    const navigate = useNavigate();
    
    async function logoutApplicant() {
        try {
            await axios.post("/api/applicant/logout", {}, {
                withCredentials: true
            })
            toggleSideBar()
            logoutUser();
            setApplicantActiveLink("home")
            navigate("/applicant/login");

        } catch (error) {
            console.log(error);
        }
    }

    // useEffect(() => {
    //     setApplicantActiveLink("home")
    // }, [])

    return (
        <>
            <div onClick={toggleSideBar} className={`fixed inset-0 z-30 bg-gray-800/50 transition-opacity duration-300 ${status ? "opacity-100 visible" : "opacity-0 invisible"}`}></div>
            <aside className={`p-5 pt-7 fixed top-0 right-0 ${
    status ? "translate-x-0" : "translate-x-full"
  } transition-transform duration-300 ease-out w-[70%] h-full z-40 bg-[#F9FAFB] md:w-[50%] md:p-10`}>
                <div className="absolute top-3 right-3 bg-[#EBF9F0] p-2 rounded-full" >
                    <IoClose size={25} onClick={toggleSideBar} />
                </div>

                <div className="w-full">
                    <div className="w-25 h-25 m-auto mt-7 mb-3 rounded-full">
                        <img className="w-full h-full object-cover rounded-full" src={currentUser.profilePhoto ? `${currentUser.profilePhoto}` : defaultProfile} alt="Profile Picture" />
                    </div>
                    <div className="font-bold text-center text-xl mb-3">{currentUser.firstName}&nbsp;{currentUser.lastName}</div>
                    <hr className="h-px bg-gray-300 border-none mb-3"/>

                    <div onClick={() => setApplicantActiveLink("home")} className={`mb-2 rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "home" ? "bg-[#D7F1E0]" : "hover:bg-[#D7F1E0] transition-colors duration-200 ease-in"}`}>
                        <Link className="flex gap-3 items-center md:gap-5 " to="/applicant/home" onClick={toggleSideBar}>
                            <span className={`rounded-xl p-1.5 ${applicantActiveLink === "home" ? "bg-[#109D5C] text-white" : "text-green-700 bg-[#EBF9F0]"}`}>
                                <MdOutlineHome size={25} />
                            </span>
                            <span className={`${applicantActiveLink === "home" ? "font-bold" : "font-mediun"}`}>Home</span>
                            
                        </Link>
                    </div>

                    <div onClick={() => setApplicantActiveLink("profile")} className={`mb-2 rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "profile" ? "bg-[#D7F1E0]" : "hover:bg-[#D7F1E0] transition-colors duration-100 ease-in"}`}>
                        <Link className="flex gap-3 items-center md:gap-5" to="/applicant/myProfile" onClick={toggleSideBar}>
                            <span className={`rounded-xl p-1.5 ${applicantActiveLink === "profile" ? "bg-[#109D5C] text-white" : "text-green-700 bg-[#EBF9F0]"}`}>
                                <RxAvatar size={22} />
                            </span>
                            <span className={`${applicantActiveLink === "profile" ? "font-bold" : "font-mediun"}`}>My Profile</span>
                            
                        </Link>
                    </div>

                    <div onClick={() => setApplicantActiveLink("saved")} className={`mb-2 rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "saved" ? "bg-[#D7F1E0]" : "hover:bg-[#D7F1E0] transition-colors duration-100 ease-in"}`}>
                        <Link className="flex gap-3 items-center md:gap-5" to="/applicant/savedJobs" onClick={toggleSideBar}>
                            <span className={`rounded-xl p-2 ${applicantActiveLink === "saved" ? "bg-[#109D5C] text-white" : "text-green-700 bg-[#EBF9F0]"}`}>
                                <FaBookmark />
                            </span>
                            <span className={`${applicantActiveLink === "saved" ? "font-bold" : "font-mediun"}`}>Saved Jobs</span>
                            
                        </Link>
                    </div>

                    <div onClick={() => setApplicantActiveLink("applications")} className={`mb-2 rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "applications" ? "bg-[#D7F1E0]" : "hover:bg-[#D7F1E0] transition-colors duration-100 ease-in"}`}>
                        <Link className="flex gap-3 items-center md:gap-5" to="/applicant/jobApplications" onClick={toggleSideBar}>
                            <span className={`rounded-xl p-2 ${applicantActiveLink === "applications" ? "bg-[#109D5C] text-white" : "text-green-700 bg-[#EBF9F0]"}`}>
                                <FaList />
                            </span>
                            <span className={`${applicantActiveLink === "applications" ? "font-bold" : "font-mediun"}`}>Job Applications</span>
                            
                        </Link>
                    </div>

                    <div onClick={() => setApplicantActiveLink("settings")} className={`rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "settings" ? "bg-[#D7F1E0]" : "hover:bg-[#D7F1E0] transition-colors duration-100 ease-in"}`}>
                        <Link className="flex gap-3 items-center md:gap-5" to="/applicant/settings" onClick={toggleSideBar}>
                            <span className={`rounded-xl p-2 ${applicantActiveLink === "settings" ? "bg-[#109D5C] text-white" : "text-green-700 bg-[#EBF9F0]"}`}>
                                <VscGear size={20} />
                            </span>
                            <span className={`${applicantActiveLink === "settings" ? "font-bold" : "font-mediun"}`}>Account Settings</span>
                            
                        </Link>
                    </div>
                </div>

                <hr className="h-px bg-gray-300 border-none mt-7 mb-5"/>   
                <button onClick={logoutApplicant} className="text-lg font-bold text-red-600"><MdOutlineLogout size={20} className="inline mr-4 text-red-600" />Log out</button>
            </aside>
        </>
    )
}