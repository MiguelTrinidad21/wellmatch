import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Footer from "../../components/others/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { userStore } from "../../zustand/userState";
import { BiLoaderAlt } from "react-icons/bi";
import axios from "axios";
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import Translucent from "../../components/overlay/Translucent";
import Loading from "../../components/others/Loading";

export default function InviteEmployer() {
    const navigate = useNavigate();

    const { currentUser } = userStore();
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [employerToInvite, setEmployerToInvite] = useState({
        email: ""
    });
    const [isSending, setIsSending] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);
    const [error, setError] = useState("");

    
    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setIsSending(true);

            await axios.post(
                "/api/employer/companyProfile/invite",
                employerToInvite,
                {withCredentials: true}
            );

            setShowPopUp(true);
            setIsSending(false);
            setError("");
        } catch (error) {
            setIsSending(false);

            const backendMessage = error.response?.data?.message;

            setError(backendMessage)
        }
    }

    function closePopUp() {
        setShowPopUp(false);
    }

    useEffect(() => {
        async function checkAdmin() {
            try {
                console.log(currentUser);
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    setLoading(false);
                    return;
                }

                await axios.get("/api/employer/authorizeAdmin", {
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

        checkAdmin();
    }, [currentUser]);


    if (loading) {
        return <Loading />
    }

    if (!verified) {
        navigate("/forbidden");
    }

    return (
        <>
            <div className="w-full h-screen px-6 bg-[#F3F4F6]">
                <AuthNavBar />
                <Overlay />

                {showPopUp && 
                    <> 
                        <Translucent />
                        <ConfirmationBox buttonText="Close" onClick={closePopUp} text="Email sent successfully" />
                    </>
                }

                <h1 className="font-semibold text-2xl my-5">Invite your co-employer</h1>
                <h2 className="text-lg font-medium mb-5">Enter your co-employer's email address to send them a registration link via email</h2>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="email" className="block mb-3">Email</label>
                    <input className="block border w-full text-md p-2 mb-3 rounded-md" 
                        type="email" 
                        placeholder="employer@gmail.com"
                        value={employerToInvite.email}
                        onChange={(e) => setEmployerToInvite({
                            ...employerToInvite,
                            email: e.target.value})}
                        required
                    />
                    {error &&
                        <p className="text-red-600 text-[13px] italic mb-3">
                            {error}
                        </p>
                    }

                    <PrimaryButton className={`w-full mb-5 ${isSending && "opacity-50"}`} type="submit" disabled={isSending}>
                        {isSending ? 
                            <>
                                <BiLoaderAlt className="animation-spin mr-3 inline" />
                                Sending email...
                            </>
                        : "Send Email"}
                        
                    </PrimaryButton>
                    <Link className="font-semibold block w-full text-center" to="/employer/companyProfile">Cancel</Link>
                </form>

                
            </div>
            <Footer />
            
            
        </>
    )
}