import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import ApplicantSideBar from "../../components/navBars/ApplicantSideBar";
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import ConfirmatonBox from "../../components/popUps/ConfirmationBox"
import { ChangeEmailForm, ChangePasswordForm, DeleteAccountForm } from "../../components/popUps/AccountSettingsForms";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import { sideBarStore } from "../../zustand/stateHandlers";
import axios from "axios";
import { IoPersonSharp } from "react-icons/io5";
import { GoShieldLock } from "react-icons/go";
import { VscWarning } from "react-icons/vsc";

export default function AccountSettings() {
    const navigate = useNavigate();
    const { currentUser, logoutUser } = userStore();
    const { setApplicantActiveLink } = sideBarStore();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);

    const [openChangeEmail, setOpenChangeEmail] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [openDelAccount, setOpenDelAccount] = useState(false);

    const [showConfirmEmail, setShowConfirmEmail] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    useEffect(() => {
        async function checkApplicant() {
            try {
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    return;
                }

                await axios.get("/api/applicant/authorize", {
                    params: {
                        applicantID: currentUser.applicantID
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

        checkApplicant();
    }, [currentUser]);
    
    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden");
        }
    }, [loading, verified, navigate]);

    useEffect(() => {
        setApplicantActiveLink("Account Settings");
    }, []);
    
    async function logout() {
        try {
            await axios.post("/api/applicant/logout", {}, {
                withCredentials: true
            });
            logoutUser()
            navigate("/applicant/login")
        } catch (error) {
            console.log(error);
        }
    }

    // if (loading) {
    //     return <Loading />
    // }

    if (!verified) {
        return null;
    }

    return (
        <div className="lg:flex relative w-full">
            <ApplicantSideBar />
            <SideBarOverlay />

            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />

                {
                    openChangeEmail &&
                    <ChangeEmailForm 
                        toggleForm={() => setOpenChangeEmail(false)}
                        confirmFunc={() => setShowConfirmEmail(true)}
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
                    showConfirmEmail &&
                    <ConfirmatonBox
                        text="Email address updated successfully"
                        onClick={() => setShowConfirmEmail(false)}
                    />
                }

                {
                    showConfirmPass &&
                    <ConfirmatonBox
                        text="Password updated successfully"
                        onClick={() => setShowConfirmPass(false)}
                    />
                }

                {
                    showConfirmDelete &&
                    <ConfirmatonBox 
                        text="Account deleted successfully"
                        onClick={() => {
                            setShowConfirmDelete(false)
                            logout()
                        }}
                    />
                }

                <div className="w-full p-6 md:p-15 xl:px-30">
                    <h1 className="font-bold text-2xl xl:text-3xl mb-1">Account Settings</h1>
                    <p className="mb-10 xl:text-lg">Manage your email, password, and account preferences</p>

                    <div className="w-full xl:w-150 xl:p-8 bg-white shadow-md p-4 rounded-xl m-auto md:mx-0 mb-6 md:w-120">
                        <div className="flex gap-4 mb-4 items-center text-gray-800">
                            <IoPersonSharp size={20} />
                            <h1 className="text-[22px] xl:text-2xl text-gray-800 font-bold">Account</h1>
                        </div>
                        
                        <h2 className="font-semibold text-lg xl:text-xl xl:mb-1 text-gray-700">Email Address</h2>
                        <p className="text-gray-500 font-medium xl:text-lg mb-5">{currentUser.email}</p>

                        <div className="flex justify-end">
                            <PrimaryButton onClick={() => setOpenChangeEmail(true)} className="rounded-lg">Update Email</PrimaryButton>
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