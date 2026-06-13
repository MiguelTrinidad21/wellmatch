import { RxAvatar } from "react-icons/rx";
import { FiBriefcase } from "react-icons/fi";
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

export default function EmployerSideMenu() {
    const { toggleSideBar } = sideBarStore();
    const { clearCreatedJob } = jobCreationStore();
    const { currentUser, handleCurrentUser } = userStore();
    const navigate = useNavigate();
    
    async function logoutEmployer() {
        try {
            await axios.post("/api/employer/logout", {}, {
                withCredentials: true
            })
            handleCurrentUser(null);
            toggleSideBar()
            navigate("/employer/login");
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
                        <img className="w-full h-full object-cover rounded-full" src={currentUser.companyPhoto ? `${currentUser.companyPhoto}` : defaultCover} alt="Company Logo" />
                    </div>
                    <div>{currentUser.firstName}&nbsp;{currentUser.lastName}</div>
                    <div>{currentUser.companyName}</div>

                    <div><Link to="/employer/jobs" onClick={toggleSideBar}><FiBriefcase className="inline mr-4" /> Jobs</Link></div>
                    <div><Link to="/employer/viewApplicants" to={toggleSideBar}><FaList className="inline mr-4" /> Applicants</Link></div>
                    <div><Link to="/employer/settings" onClick={toggleSideBar}><FaGear className="inline mr-4" /> Account Settings</Link></div>
                    <div><Link to="/employer/companyProfile" onClick={toggleSideBar}><RxAvatar className="inline mr-4" /> Company Profile</Link></div>
                    <PrimaryButton onClick={() => {
                        clearCreatedJob();
                        toggleSideBar();
                    }} className="w-full block text-center">
                        <Link to="/employer/createJob">Create Job Post</Link>
                    </PrimaryButton>
                </div>    
                <button onClick={logoutEmployer} className="mt-7"><MdOutlineLogout className="inline mr-4" />Log out</button>
            </aside>
        </>
    )
}