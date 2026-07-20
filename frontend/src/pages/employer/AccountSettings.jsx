import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import EmployerSideBar from "../../components/navBars/EmployerSideBar";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Translucent from "../../components/overlay/Translucent"
import { EditInfoForm, ChangePasswordForm, DeleteAccountForm } from "../../components/popUps/EmployerAccSettingsForms";
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import Loading from "../../components/others/Loading";
import { userStore } from "../../zustand/userState";
import { sideBarStore } from "../../zustand/stateHandlers";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { IoPersonSharp } from "react-icons/io5";
import { GoShieldLock } from "react-icons/go";
import { VscWarning } from "react-icons/vsc";

export default function AccountSettings() {
    const { currentUser, logoutUser } = userStore();
    const { setEmployerActiveLink } = sideBarStore();
    const navigate = useNavigate();

    const [openUpdateInfo, setOpenUpdateInfo] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [openDelAccount, setOpenDelAccount] = useState(false);

    const [showConfirmInfo, setShowConfirmInfo] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        async function checkEmployer() {
            setLoading(true);
            try {
                console.log(currentUser);
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    return;
                }

                await axios.get("/api/employer/authorize", {
                    params: {
                        employerID: currentUser.employerID
                    }
                });

                setVerified(true);
            } catch (error) {
                console.log(error);
                setVerified(false);
            } finally {
                setLoading(false);
            }
        }

        checkEmployer();
    }, [currentUser]);

    useEffect(() => {
        setEmployerActiveLink("Account Settings")
    }, [])

    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden", { replace: true });
        }
    }, [loading, verified, navigate]);

    if (loading) {
        return <Loading />
    }

    if (!verified) {
        return null;
    }

    return (
        <div className="lg:flex relative w-full">
            <SideBarOverlay />
            <EmployerSideBar />

            <div className="w-full min-h-screen bg-[#F3F4F6]">
                <AuthNavBar />

                {
                    openUpdateInfo &&
                    <EditInfoForm 
                        toggleForm={() => setOpenUpdateInfo(false)}
                        confirmFunc={() => setShowConfirmInfo(true)}
                    />
                }

                {
                    openChangePassword &&
                    <ChangePasswordForm
                        toggleForm={() => setOpenChangePassword(false)}
                        confirmFunc={() => setShowConfirmPass(true)}
                    />
                }

                {
                    openDelAccount &&
                    <DeleteAccountForm
                        toggleForm={() => setOpenDelAccount(false)}
                        confirmFunc={() => setShowConfirmDelete(true)}
                    />
                }

                {
                    showConfirmInfo &&
                    <ConfirmationBox 
                        text="Information updated successfully"
                        onClick={() => setShowConfirmInfo(false)}                        
                    />
                }

                {
                    showConfirmPass &&
                    <ConfirmationBox 
                        text="Password changed successfully"
                        onClick={() => setShowConfirmPass(false)}                        
                    />
                }      

                {
                    showConfirmDelete &&
                    <ConfirmationBox 
                        text="Account deleted successfully"
                        onClick={() => {
                            setShowConfirmDelete(false)
                            logoutUser()
                        }}
                    />
                }

                <div className="w-full p-6 md:p-15 xl:px-30">
                    <h1 className="font-bold text-2xl xl:text-3xl mb-1">Account Settings</h1>
                    <p className="mb-10 xl:text-lg">Manage your email, password, and account preferences</p>

                    <div className="w-full xl:w-150 xl:p-8 bg-white shadow-md p-4 rounded-xl m-auto md:mx-0 mb-6 md:w-120">
                        <div className="flex gap-4 mb-4 items-center text-gray-800">
                            <IoPersonSharp size={20} />
                            <h2 className="text-[22px] xl:text-2xl text-gray-800 font-bold">Personal Details</h2>
                        </div>

                        <h2 className="font-semibold text-lg xl:text-xl xl:mb-1 text-gray-700">Name</h2>
                        <p className="text-gray-500 font-medium xl:text-lg mb-5">{currentUser.firstName}&nbsp;{currentUser.lastName}</p>                        

                        <h2 className="font-semibold text-lg xl:text-xl xl:mb-1 text-gray-700">Email Address</h2>
                        <p className="text-gray-500 font-medium xl:text-lg mb-5">{currentUser.email}</p>

                        <h2 className="font-semibold text-lg xl:text-xl xl:mb-1 text-gray-700">Permission</h2>
                        <p className="text-gray-500 font-medium xl:text-lg mb-5">You have an {currentUser.role} privilege</p>

                        <div className="flex justify-end">
                            <PrimaryButton onClick={() => setOpenUpdateInfo(true)} className="px-5 rounded-lg">Update Details</PrimaryButton>
                        </div>
                    </div>

                    <div className="w-full md:w-120 xl:w-150 xl:p-8 bg-white shadow-md p-4 rounded-xl m-auto md:mx-0 mb-6">
                        <div className="flex gap-4 mb-4 items-center text-gray-800">
                            <GoShieldLock size={25} />
                            <h1 className="text-[22px] text-gray-800 font-bold">Security</h1>
                        </div>

                        <h2 className="font-semibold xl:text-xl xl:mb-1 text-lg text-gray-700">Password</h2>
                        <p className="mb-5">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</p>

                        <div className="flex justify-end">
                            <PrimaryButton onClick={() => setOpenChangePassword(true)} className="rounded-lg">Update Password</PrimaryButton>
                        </div>
                    </div>

                    <div className="w-full xl:w-150 xl:p-8 border border-red-600 bg-[#FFF1F2] shadow-md p-4 m-auto md:mx-0 rounded-xl md:w-120">
                        <div className="flex gap-4 mb-4 items-center text-red-900">
                            <VscWarning size={25} />
                            <h1 className="text-[22px] font-bold">Delete Account</h1>
                        </div>
                        <p>Permanently delete your account.</p>
                        <p className="mb-5">This action cannot be undone.</p>
                        <div className="flex justify-end">                            
                            <PrimaryButton onClick={() => setOpenDelAccount(true)} className="bg-red-600 px-5 rounded-lg">Delete Account</PrimaryButton>
                        </div>
                    </div>
                    
                </div>              

            </div>

        </div>
    )
}