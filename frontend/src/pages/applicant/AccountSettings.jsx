import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer"
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import ConfirmatonBox from "../../components/popUps/ConfirmationBox"
import { ChangeEmailForm, ChangePasswordForm, DeleteAccountForm } from "../../components/popUps/AccountSettingsForms";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import axios from "axios";

export default function AccountSettings() {
    const navigate = useNavigate();
    const { currentUser, logoutUser } = userStore();

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
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />
                <Overlay />

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

                <div className="w-full p-6 md:p-15">
                    <h1 className="font-bold text-2xl text-center mb-10">Account Settings</h1>

                    <div className="w-full m-auto bg-white shadow-md p-4 rounded-xl mb-6 md:w-100">
                        <div className="w-full flex justify-between items-center mb-3">
                            <h2 className="font-bold text-lg">Email Address</h2>
                            <PrimaryButton onClick={() => setOpenChangeEmail(true)}>Change</PrimaryButton>
                        </div>
                        <p className="text-gray-500 font-medium">{currentUser.email}</p> 
                    </div>

                    <div className="w-full m-auto bg-white shadow-md p-4 rounded-xl mb-6 flex md:w-100">
                        <div className="w-full flex justify-between items-center">
                            <h2 className="font-bold text-lg">Password</h2>
                            <PrimaryButton onClick={() => setOpenChangePassword(true)}>Change</PrimaryButton>
                        </div>
                    </div>

                    <div className="w-full m-auto bg-white shadow-md p-4 rounded-xl md:w-100">
                        <div className="w-full flex justify-between items-center">
                            <h2 className="font-bold text-lg">Delete Account</h2>
                            <PrimaryButton onClick={() => setOpenDelAccount(true)} className="bg-red-600 px-5">Delete</PrimaryButton>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    )
}