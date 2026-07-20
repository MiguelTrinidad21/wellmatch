import { IoMdMenu } from "react-icons/io";
import { IoChevronDown } from "react-icons/io5";
import { IoChevronUp } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import webLogo from '../../assets/WellMatch_Logo.png'
import { Link } from "react-router-dom";
import EmployerSideMenu from "./EmployerSideMenu";
import ApplicantSideMenu from "./ApplicantSideMenu";
import { sideBarStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";
import { companyStore } from "../../zustand/stateHandlers";
import defaultProfile from "../../assets/defaultProfile.jpg"
import PrimaryButton from "../buttons/PrimaryButton";

export default function AuthNavBar() {
    const { sideBarStatus, toggleSideBar, applicantActiveLink, employerActiveLink } = sideBarStore();
    const { currentUser } = userStore();
    const { companyInfo, setCompanyInfo } = companyStore();
    

    return (
        <>
            <nav className="sticky left-0 top-0 z-20 flex h-16 w-full items-center justify-between bg-white px-5 shadow-sm md:pr-15 md:pl-14 md:h-18 lg:h-20 lg:px-10 xl:pl-29 xl:pr-30">
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

                <div className="hidden lg:flex items-center gap-15">

                    <div className="flex items-center justify-between gap-4 relative">
                        <div className="w-10 h-10 rounded-full border-3 border-green-700">
                            {
                                currentUser.userType === "applicant" ? 
                                    <img className="w-full h-full rounded-full object-cover" src={currentUser.profilePhoto ? `${currentUser.profilePhoto}` : defaultProfile} alt="" />                                
                                :   
                                    <img className="w-full h-full rounded-full object-cover" src={companyInfo.profilePhotoURL ? `${companyInfo.profilePhotoURL}` : defaultProfile} alt="Company Logo" />                            
                            }
                        </div>
                        <div>
                            <p className="font-semibold text-xl">{currentUser.firstName} {currentUser.lastName}</p>
                            <p className="text-gray-600 text-sm font-medium">{currentUser.role}</p>
                        </div>

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