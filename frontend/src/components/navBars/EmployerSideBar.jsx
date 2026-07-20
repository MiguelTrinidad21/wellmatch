import { RxAvatar } from "react-icons/rx";
import { FiBriefcase } from "react-icons/fi";
import { FaPlus } from "react-icons/fa6";
import { FaList } from "react-icons/fa";
import { VscGear } from "react-icons/vsc";
import { MdOutlineLogout } from "react-icons/md";
import webLogo from '../../assets/WellMatch_Logo.png'
import { sideBarStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";
import { Link } from "react-router-dom";
import axios from "axios";


export default function EmployerSideBar() {
    const { employerActiveLink, setEmployerActiveLink } = sideBarStore();
    const { logoutUser } = userStore();

    async function logoutEmployer() {
        try {
            await axios.post("/api/employer/logout", {}, {
                withCredentials: true
            })
            logoutUser();
            setEmployerActiveLink("Jobs")
            navigate("/employer/login");

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <aside className="hidden lg:block fixed top-0 left-0 bg-[#F7F8FA] text-gray-700 lg:w-65 xl:w-75 h-screen px-5">
            <div className="w-full mt-5 mb-10">
                <img src={webLogo} alt="" className="h-15 w-auto m-auto object-contain" />
            </div>
             
            <div className="w-full">
                <div onClick={() => setEmployerActiveLink("Jobs")} className={`mb-2 cursor-pointer rounded-xl ${employerActiveLink === "Jobs" ? "bg-green-600 text-white" : "hover:bg-[#D7F1E0] text-gray-700 transition-colors duration-200 ease-in"}`}>
                    <Link className="flex gap-3 items-center md:gap-4 py-2.25 px-2.5" to="/employer/jobs" >
                        <span className="rounded-xl p-1.5 bg-[#EBF9F0] text-green-700">
                            <FiBriefcase size={20} />                       
                        </span>                        
                        <span className={`${employerActiveLink === "Jobs" ? "text-white font-bold" : "text-gray-700 font-semibold"}`}>Jobs</span>                       
                    </Link>
                </div>

                <div onClick={() => setEmployerActiveLink("Applicants")} className={`mb-2 cursor-pointer rounded-xl ${employerActiveLink === "Applicants" ? "bg-green-600 text-white" : "hover:bg-[#D7F1E0] text-gray-700 transition-colors duration-200 ease-in"}`}>
                    <Link className="flex gap-3 items-center md:gap-5 py-2.25 px-2.5" to="/employer/jobs/selectFirst/applicants" >
                        <span className="rounded-xl p-1.5 bg-[#EBF9F0] text-green-700">
                            <FaList size={18} />
                        </span>
                        <span className={`${employerActiveLink === "Applicants" ? "text-white font-bold" : "text-gray-700 font-semibold"}`}>Applicants</span>
                        
                    </Link>
                </div>

                <div onClick={() => setEmployerActiveLink("Company Profile")} className={`mb-2 cursor-pointer rounded-xl ${employerActiveLink === "Company Profile" ? "bg-green-600 text-white" : "hover:bg-[#D7F1E0] text-gray-700 transition-colors duration-200 ease-in"}`}>
                    <Link className="flex gap-3 items-center md:gap-5 py-2.25 px-2.5" to="/employer/companyProfile" >
                        <span className="rounded-xl p-1.5 bg-[#EBF9F0] text-green-700">
                            <RxAvatar size={20} />
                        </span>
                        <span className={` ${employerActiveLink === "Company Profile" ? "text-white font-bold" : "text-gray-700 font-semibold"}`}>Company Profile</span>
                        
                    </Link>
                </div>

                <div onClick={() => setEmployerActiveLink("Account Settings")} className={`mb-2 cursor-pointer rounded-xl ${employerActiveLink === "Account Settings" ? "bg-green-600 text-white" : "hover:bg-[#D7F1E0] text-gray-700 transition-colors duration-200 ease-in"}`}>
                    <Link className="flex gap-3 items-center md:gap-5 py-2.25 px-2.5" to="/employer/settings" >
                        <span className="rounded-xl p-1.5 bg-[#EBF9F0] text-green-700">
                            <VscGear size={20} />
                        </span>
                        <span className={`${employerActiveLink === "Account Settings" ? "text-white font-bold" : "text-gray-700 font-semibold"}`}>Account Settings</span>
                        
                    </Link>
                </div>  

                <hr className="h-0.5 border-none bg-gray-200 my-7"/>   

                <button onClick={logoutEmployer} className="text-lg px-4 font-bold text-red-600 cursor-pointer"><MdOutlineLogout size={20} className="inline mr-4 text-red-600" />Log out</button>
            </div>
        </aside>
    )
}