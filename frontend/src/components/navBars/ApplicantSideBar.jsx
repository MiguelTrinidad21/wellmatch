import { RxAvatar } from "react-icons/rx";
import { MdOutlineHome } from "react-icons/md";
import { FaBookmark } from "react-icons/fa6";
import { FaList } from "react-icons/fa";
import { VscGear } from "react-icons/vsc";
import { MdOutlineLogout } from "react-icons/md";
import webLogo from '../../assets/WellMatch_Logo.png'
import { sideBarStore } from "../../zustand/stateHandlers";
import { Link } from "react-router-dom";


export default function ApplicantSideBar() {
    const { applicantActiveLink, setApplicantActiveLink } = sideBarStore();

    async function logoutApplicant() {
        try {
            await axios.post("/api/applicant/logout", {}, {
                withCredentials: true
            })
            logoutUser();
            setApplicantActiveLink("Home")
            navigate("/applicant/login");

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <aside className="hidden lg:block fixed top-0 left-0 bg-[#F4F8F5] text-gray-700 lg:w-65 xl:w-75 h-screen px-5">
            <div className="w-full mt-5 mb-10">
                <img src={webLogo} alt="" className="h-15 w-auto m-auto object-contain" />
            </div>
             
            <div className="w-full">
                <div onClick={() => setApplicantActiveLink("Home")} className={`mb-2 cursor-pointer rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "Home" ? "bg-green-600 text-white" : "hover:bg-[#D7F1E0] text-gray-700 transition-colors duration-200 ease-in"}`}>
                    <Link className="flex gap-3 items-center md:gap-4 " to="/applicant/home" >
                        <span className="rounded-xl p-1.5 bg-[#EBF9F0] text-green-700">
                            <MdOutlineHome size={25} />                       
                        </span>                        
                        <span className={`${applicantActiveLink === "Home" ? "text-white font-bold" : "text-gray-700 font-semibold"}`}>Home</span>                       
                    </Link>
                </div>

                <div onClick={() => setApplicantActiveLink("My Profile")} className={`mb-2 cursor-pointer rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "My Profile" ? "bg-green-600 text-white" : "hover:bg-[#D7F1E0] text-gray-700 transition-colors duration-200 ease-in"}`}>
                    <Link className="flex gap-3 items-center md:gap-5" to="/applicant/myProfile" >
                        <span className="rounded-xl p-1.5 bg-[#EBF9F0] text-green-700">
                            <RxAvatar size={22} />
                        </span>
                        <span className={`${applicantActiveLink === "My Profile" ? "text-white font-bold" : "text-gray-700 font-semibold"}`}>My Profile</span>
                        
                    </Link>
                </div>

                <div onClick={() => setApplicantActiveLink("Saved Jobs")} className={`mb-2 cursor-pointer rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "Saved Jobs" ? "bg-green-600 text-white" : "hover:bg-[#D7F1E0] text-gray-700 transition-colors duration-200 ease-in"}`}>
                    <Link className="flex gap-3 items-center md:gap-5" to="/applicant/savedJobs" >
                        <span className="rounded-xl p-1.5 bg-[#EBF9F0] text-green-700">
                            <FaBookmark />
                        </span>
                        <span className={` ${applicantActiveLink === "Saved Jobs" ? "text-white font-bold" : "text-gray-700 font-semibold"}`}>Saved Jobs</span>
                        
                    </Link>
                </div>

                <div onClick={() => setApplicantActiveLink("Job Applications")} className={`mb-2 cursor-pointer rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "Job Applications" ? "bg-green-600 text-white" : "hover:bg-[#D7F1E0] text-gray-700 transition-colors duration-200 ease-in"}`}>
                    <Link className="flex gap-3 items-center md:gap-5" to="/applicant/jobApplications" >
                        <span className="rounded-xl p-1.5 bg-[#EBF9F0] text-green-700">
                            <FaList />
                        </span>
                        <span className={`${applicantActiveLink === "Job Applications" ? "text-white font-bold" : "text-gray-700 font-semibold"}`}>Job Applications</span>
                        
                    </Link>
                </div>

                <div onClick={() => setApplicantActiveLink("Account Settings")} className={`mb-2 cursor-pointer rounded-xl py-2.25 px-2.5 ${applicantActiveLink === "Account Settings" ? "bg-green-600 text-white" : "hover:bg-[#D7F1E0] text-gray-700 transition-colors duration-200 ease-in"}`}>
                    <Link className="flex gap-3 items-center md:gap-5" to="/applicant/settings" >
                        <span className="rounded-xl p-1.5 bg-[#EBF9F0] text-green-700">
                            <VscGear size={20} />
                        </span>
                        <span className={`${applicantActiveLink === "Account Settings" ? "text-white font-bold" : "text-gray-700 font-semibold"}`}>Account Settings</span>
                        
                    </Link>
                </div>                
            </div>
        </aside>
    )
}