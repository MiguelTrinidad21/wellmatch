import { IoMdMenu } from "react-icons/io";
import { IoChevronDown } from "react-icons/io5";
import { IoChevronUp } from "react-icons/io5";
import webLogo from '../../assets/WellMatch_Logo.png'
import { Link } from "react-router-dom";
import EmployerSideMenu from "./EmployerSideMenu";
import ApplicantSideMenu from "./ApplicantSideMenu";
import { sideBarStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";
import defaultProfile from "../../assets/defaultProfile.jpg"

export default function AuthNavBar() {
    const { sideBarStatus, toggleSideBar, applicantActiveLink, employerActiveLink } = sideBarStore();
    const { currentUser } = userStore();
    

    return (
        <>
            <nav className="sticky left-0 top-0 z-20 flex h-16 w-full items-center justify-between bg-[#F8FBF9] px-5 shadow-sm md:pr-15 md:pl-14 md:h-18 lg:h-20 lg:px-10 xl:pl-29 xl:pr-30">
                {currentUser.userType === "applicant" 
                    ? <p className="hidden lg:block font-emibold text-gray-700">{applicantActiveLink}</p>
                    : <p className="hidden lg:block font-emibold text-gray-700">{employerActiveLink}</p>                    
                }

                <Link className="lg:hidden" to="/">
                    <img
                    className="h-11 w-auto object-contain md:h-12 lg:h-15"
                    src={webLogo}
                    alt="WellMatch Logo"
                    />
                </Link>

                <IoMdMenu className="lg:hidden" size={30} onClick={toggleSideBar} />
                <div className="hidden lg:flex items-center justify-between gap-5 relative">
                    <p className="font-semibold text-xl">{currentUser.firstName} {currentUser.lastName}</p>
                    <div className="w-10 h-10 rounded-full border-3 border-green-700">
                        <img className="w-full h-full rounded-full object-cover" src={currentUser.profilePhoto ? `${currentUser.profilePhoto}` : defaultProfile} alt="" />
                    </div>

                </div>
            </nav>

            { 
                currentUser.userType === "applicant" ? 
                    <ApplicantSideMenu status={sideBarStatus} />
                :   
                    <EmployerSideMenu status={sideBarStatus} />
                
            }
        </>
    )
}