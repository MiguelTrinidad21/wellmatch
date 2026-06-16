import { RxAvatar } from "react-icons/rx";
import { MdOutlineHome } from "react-icons/md";
import { FaBookmark } from "react-icons/fa6";
import { FaList } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { MdOutlineLogout } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { sideBarStore, jobCreationStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";
import { Link, useNavigate } from "react-router-dom";
import PrimaryButton from "../buttons/PrimaryButton";
import defaultCover from "../../assets/defaultCover.jpg"
import axios from "axios";

export default function ApplicantSideMenu() {
    const { toggleSideBar } = sideBarStore();
    const { clearCreatedJob } = jobCreationStore();
    const { currentUser, logoutUser } = userStore();
    const navigate = useNavigate();
    
    async function logoutApplicant() {
        try {
            await axios.post("/api/applicant/logout", {}, {
                withCredentials: true
            })
            logoutUser();
            toggleSideBar()
            navigate("/applicant/login");
        } catch {
            
        }
    }

    return (
        <>
            <div onClick={toggleSideBar} className="fixed inset-0 z-30 opacity-50 bg-gray-600"></div>
            <aside className="p-5 pt-7 fixed top-0 right-0 w-[70%] h-full z-40 bg-[#F9FAFB]">
                <IoClose className="absolute top-2 right-2" size={35} onClick={toggleSideBar} />

                <div className="w-full">
                    <div className="w-25 h-25 rounded-full">
                        <img className="w-full h-full object-cover rounded-full" src={currentUser.profilePhoto ? `${currentUser.profilePhoto}` : defaultCover} alt="Profile Picture" />
                    </div>
                    <div>{currentUser.firstName}&nbsp;{currentUser.lastName}</div>

                    <div><Link to="/employer/jobs" onClick={toggleSideBar}><MdOutlineHome size={20} className="inline mr-4" /> Home</Link></div>
                    <div><Link to="/employer/viewApplicants" to={toggleSideBar}><RxAvatar size={20} className="inline mr-4" /> My Profile</Link></div>
                    <div><Link to="/employer/settings" onClick={toggleSideBar}><FaBookmark className="inline mr-4" /> Saved Jobs</Link></div>
                    <div><Link to="/employer/companyProfile" onClick={toggleSideBar}><FaList className="inline mr-4" /> Job Applications</Link></div>
                    <div><Link to="/employer/companyProfile" onClick={toggleSideBar}><FaGear className="inline mr-4" /> Account Settings</Link></div>

                </div>    
                <button onClick={logoutApplicant} className="mt-7 font-bold text-red-600"><MdOutlineLogout size={20} className="inline mr-4 text-red-600" />Log out</button>
            </aside>
        </>
    )
}