import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Translucent from "../../components/overlay/Translucent"
import { EditInfoForm, ChangePasswordForm, DeleteAccountForm } from "../../components/popUps/EmployerAccSettingsForms";
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import Loading from "../../components/others/Loading";
import { userStore } from "../../zustand/userState";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AccountSettings() {
    const { currentUser, logoutUser } = userStore();
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
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6]">
                <AuthNavBar />
                <Overlay />

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

                <div className="w-full p-6 md:px-15 md:py-10">
                    <h1 className="font-bold text-2xl text-center mb-6">Account Settings</h1>

                    <div className="w-full m-auto rounded-2xl shadow-md bg-white p-5 mb-6 md:w-100">
                        <h2 className="text-xl font-semibold mb-1">Personal Details</h2>
                        <p className="mb-1">{currentUser.firstName}&nbsp;{currentUser.lastName}</p>
                        <p className="text-gray-500 mb-6">{currentUser.email}</p>

                        <h2 className="text-xl font-semibold mb-1">Permission</h2>
                        <p className="text-sm mb-6">You have an {currentUser.role} privilege</p>

                        <div className="flex justify-end">
                            <PrimaryButton onClick={() => setOpenUpdateInfo(true)} className="px-5">Update</PrimaryButton>
                        </div>
                    </div>

                    <div className="w-full rounded-2xl shadow-md bg-white py-3 px-6 flex justify-between items-center mb-6 m-auto md:w-100">
                        <h2 className="text-xl font-semibold mb-1">Password</h2>
                        <PrimaryButton onClick={() => setOpenChangePassword(true)} className="px-4">Change</PrimaryButton>
                    </div>

                    <div className="w-full rounded-2xl shadow-md bg-white py-3 px-6 flex justify-between items-center mb-6 m-auto md:w-100">
                        <h2 className="text-xl font-semibold mb-1">Delete Account</h2>
                        <PrimaryButton onClick={() => setOpenDelAccount(true)} className="px-5 text-white! bg-red-600">Delete</PrimaryButton>
                    </div>
                    
                </div>              

            </div>

            <Footer />
        </>
    )
}