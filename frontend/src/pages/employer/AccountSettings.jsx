import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Translucent from "../../components/overlay/Translucent"
import EditPersonalDetails from "../../components/popUps/EditPersonalDetails";
import Loading from "../../components/others/Loading";
import { userStore } from "../../zustand/userState";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AccountSettings() {
    const { currentUser } = userStore();
    const navigate = useNavigate();

    const [editProfile, setEditProfile] = useState(false)
    const [changePassword, setChangePassword] = useState(false)
    const [deleteAccount, setDeleteAccount] = useState(false)
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

    function toggleEditProfileForm() {
        setEditProfile(!editProfile);
    }

    function toggleChangePassForm() {
        setChangePassword(!changePassword);
    }

    function toggleDelAccForm() {
        setDeleteAccount(!deleteAccount);
    }

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
            <div className="w-full px-6 min-h-screen bg-[#F3F4F6]">
                <AuthNavBar />
                <Overlay />

                { editProfile &&
                    <>
                        <Translucent />
                        <EditPersonalDetails cancelFunc={toggleEditProfileForm} userType="employer" />
                    </>

                }

                <h1 className="font-bold text-2xl text-center my-6">Account Settings</h1>

                <div className="w-full rounded-2xl shadow-md bg-white p-5 mb-6">
                    <h2 className="text-xl font-semibold mb-1">Personal Details</h2>
                    <p className="mb-1">{currentUser.firstName}&nbsp;{currentUser.lastName}</p>
                    <p className="text-gray-500 mb-6">{currentUser.email}</p>

                    <h2 className="text-xl font-semibold mb-1">Permission</h2>
                    <p className="text-sm mb-6">You have an {currentUser.role} privilege</p>

                    <div className="flex justify-end">
                        <PrimaryButton onClick={toggleEditProfileForm} className="px-8">Edit</PrimaryButton>
                    </div>
                </div>

                <div className="w-full rounded-2xl shadow-md bg-white py-3 px-6 flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold mb-1">Password</h2>
                    <PrimaryButton className="px-4">Change</PrimaryButton>
                </div>

                <div className="w-full rounded-2xl shadow-md bg-white py-3 px-6 flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold mb-1">Delete Account</h2>
                    <PrimaryButton className="px-5 text-white! bg-red-600">Delete</PrimaryButton>
                </div>

            </div>

            <Footer />
        </>
    )
}