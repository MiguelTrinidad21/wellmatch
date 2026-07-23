import PrimaryButton from "../../components/buttons/PrimaryButton";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { userStore } from "../../zustand/userState";
import { BiLoaderAlt } from "react-icons/bi";
import { MdMailOutline } from "react-icons/md";
import axios from "axios";
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import Translucent from "../../components/overlay/Translucent";
import Loading from "../../components/others/Loading";

export default function InviteEmployer({ cancelFunc, setInviteSent }) {
    const navigate = useNavigate();

    const { currentUser } = userStore();
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [employerToInvite, setEmployerToInvite] = useState({
        email: ""
    });
    const [isSending, setIsSending] = useState(false);
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

            setIsSending(false);
            setError("");
            setInviteSent();
            cancelFunc();
        } catch (error) {
            setIsSending(false);

            const backendMessage = error.response?.data?.message;

            setError(backendMessage)
        }
    }



    return (
        <>
            <Translucent />

            <div className="fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-40 w-[90%] md:w-100 rounded-2xl bg-white shadow-md p-6">
                <div className="w-15 h-15 flex justify-center items-center text-green-700 p-4 bg-[#E7F4EC] rounded-2xl m-auto mb-6">
                    <MdMailOutline size={30}/>
                </div>
                <h1 className="font-bold text-center text-xl md:text-3xl mb-5">Invite your co-employer</h1>
                <h2 className="text-gray-600 text-center font-medium mb-6">Enter your co-employer's email address to send them a registration link via email</h2>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="email" className="block mb-3 font-semibold">Email Address</label>
                    <input 
                        type="email" 
                        id="email"
                        placeholder="employer@gmail.com"
                        value={employerToInvite.email}
                        onChange={(e) => setEmployerToInvite({
                            ...employerToInvite,
                            email: e.target.value})}
                        required
                        className={`p-2 lg:px-4 rounded-md block w-full border-2 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out ${error ? "border-red-600 focus:border-red-600" : "border-gray-300 focus:border-green-600"}`} 
                    />
                    {error &&
                        <p className="text-red-600 text-[13px] text-center mb-3">
                            {error}
                        </p>
                    }

                    <PrimaryButton className={`w-full mb-5 ${isSending && "opacity-50"}`} type="submit" disabled={isSending}>
                        {isSending ? 
                            <>
                                <BiLoaderAlt className="animate-spin mr-3 inline" />
                                Sending email...
                            </>
                        : "Send Email"}
                        
                    </PrimaryButton>
                </form>
                    <button onClick={cancelFunc} className="cursor-pointer font-semibold block w-full text-center mb-7">Cancel</button>

                    <div className="w-full border border-gray-300 bg-gray-100 rounded-2xl p-4">
                        <p className="text-sm text-center text-gray-600">They'll receive a registration link by email. Invites expire after 24 hours if unused.</p>
                    </div>
            </div>             
 
        </>
    )
}