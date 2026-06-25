import { IoMdMenu } from "react-icons/io";
import webLogo from '../../assets/WellMatch_Logo.png'
import { Link } from "react-router-dom";
import EmployerSideMenu from "./EmployerSideMenu";
import ApplicantSideMenu from "./ApplicantSideMenu";
import { sideBarStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";

export default function AuthNavBar() {
    const { sideBarStatus, toggleSideBar } = sideBarStore();
    const { currentUser } = userStore();
    

    return (
        <>
            <nav className="fixed left-0 top-0 z-20 flex h-16 w-full items-center justify-between bg-white px-5 shadow-sm">
                <Link to="/">
                    <img
                    className="h-11 w-auto object-contain"
                    src={webLogo}
                    alt="WellMatch Logo"
                    />
                </Link>

                <IoMdMenu size={30} onClick={toggleSideBar} />
            </nav>

            {sideBarStatus && 
                (currentUser.userType === "applicant" ? 
                    <ApplicantSideMenu />
                :   
                    <EmployerSideMenu />
                )
            }
        </>
    )
}