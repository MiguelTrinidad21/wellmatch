import { useSearchParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";

import Footer from "../../components/others/Footer";
import PublicNavBar from "../../components/navBars/PublicNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Translucent from "../../components/overlay/Translucent";
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import PrimaryButton from "../../components/buttons/PrimaryButton";

import axios from "axios";

export default function EmployerRegister() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isTokenVerified, setIsTokenVerified] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);
    const [invitation, setInvitation] = useState({});
    const [errors, setErrors] = useState({});
    const [employerInfo, setEmployerInfo] = useState({
        firstName: "",
        lastName: "",
        emailAddress: "",
        password: "",
        confirmPass: "",
    })

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{12,}$/;
    const token = searchParams.get("token");

    useEffect(() => {
        
        async function verifyToken() {
            try {
                setIsLoading(true);

                const response = await axios.get(
                    `/api/employer/invitations/verify/${token}`,
                );

                setIsTokenVerified(true)
                setInvitation(response.data);
                setIsLoading(false);
                setEmployerInfo((prev) => ({
                    ...prev,
                    emailAddress: response.data.email
                }));

            } catch (err) {
                setErrors({general: "Invalid or expired invitation token."});
                setIsTokenVerified(false)
                setIsLoading(false);
                console.log(errors)
            }
        }    

            verifyToken();

    }, [])

    async function handleSubmit(e) {
        e.preventDefault();

        if (!passwordRegex.test(employerInfo.password)) {
            setErrors({
                invalidPass: "Password must be 12+ characters with uppercase, lowercase, and special characters."                
            })
            return
        }

        if (employerInfo.password !== employerInfo.confirmPass) {
            setErrors({
                confirmPass: "Password did not match"
            })
            return
        }

        try {
            await axios.post(`/api/employer/registerCoEmployer/${token}`, employerInfo,
                {withCredentials: true}
            )
            setShowPopUp(true);

        } catch (error) {
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (issue) {
                setErrors({ [issue]: message }); 
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            }
        }
    }

    function closePopUp() {
        setShowPopUp(false);
        navigate("/employer/login");
    }

    function handlePass(e) {
        setShowPassword(!showPassword);
    }

    function handleConfirmPass(e) {
        setShowConfirmPassword(!showConfirmPassword);
    }

    if (isLoading) {
            return (
                <div className="w-full h-screen flex justify-center items-center flex-col">
                    <BiLoaderAlt size={30} className="animate-spin" />
                    <p className="text-center">Please wait...</p>
                </div>
            )
        }

    if (!isTokenVerified) {
        return (
            <div className="w-full h-screen flex justify-center items-center flex-col gap-10">
                <p className="text-center">Invalid or expired invitation token.</p>
                <PrimaryButton to="/employer/login">Go to website</PrimaryButton>
            </div>
        )
    }

    return (
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <PublicNavBar />
                <Overlay />

                {showPopUp && (
                    <>
                        <Translucent />
                        <ConfirmationBox onClick={closePopUp} text="Account registered successfully" />
                    </>
                )}

                <div className="w-full p-6">
                    <h1 className="mb-6 text-center text-xl font-bold">You are invited to join {invitation.companyName}</h1>

                    <form className="w-full m-auto bg-white rounded-3xl shadow-lg p-6 mb-6 md:p-10 md:w-100 lg:w-120" onSubmit={handleSubmit}>
                        <h2 className="text-center text-lg mb-4 font-bold">Create Your Account</h2>

                        <div className="w-full">
                            <label className="block mb-1 font-semibold" htmlFor="firstName">First Name</label>
                            <input 
                                type="text"
                                value={employerInfo.firstName}
                                onChange={(e) => setEmployerInfo({...employerInfo, firstName: e.target.value})}
                                required
                                placeholder="Enter first name"
                                className="p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600" 
                            />
                        </div>

                        <div className="w-full">
                            <label className="block font-semibold mb-1" htmlFor="lastName">Last Name</label>
                            <input 
                                type="text"
                                value={employerInfo.lastName}
                                onChange={(e) => setEmployerInfo({...employerInfo, lastName: e.target.value})}
                                required
                                placeholder="Enter last name"
                                className="p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600" 
                            />
                        </div>

                        <div className="w-full">
                            <label className="block font-semibold mb-1" htmlFor="email">Email Address</label>
                            <input 
                                type="email"
                                value={invitation.email}
                                readOnly
                                required
                                className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.emailAddress ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`} 
                            />
                            {errors.emailAddress && <p className="text-red-600 text-[13px] mb-4">* {errors.emailAddress}</p>}
                        </div>

                        <div className="w-full">
                            <label className="block font-semibold mb-1" htmlFor="password">Password</label>
                            <div className="w-full relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={employerInfo.password}
                                    onChange={(e) => setEmployerInfo({...employerInfo, password: e.target.value})}
                                    required
                                    placeholder="Enter your password" 
                                    className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidPass ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`} 
                                />
                                <div onClick={handlePass} className="absolute top-1/2 -translate-y-1/2 right-2">
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </div>
                            </div>
                            {errors.invalidPass && <p className="text-red-600 text-[13px] mb-4">* {errors.invalidPass}</p>}
                        </div>

                        <div className="w-full relative">
                            <label className="block" htmlFor="confirmPass">Confirm Password</label>
                            <div className="w-full relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={employerInfo.confirmPass}
                                    onChange={(e) => setEmployerInfo({...employerInfo, confirmPass: e.target.value})}
                                    required
                                    placeholder="Re-type your password" 
                                    className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.confirmPass ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`} 
                                />
                                <div onClick={handleConfirmPass} className="absolute top-1/2 -translate-y-1/2 right-2">
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </div>
                            </div>
                            {errors.confirmPass && <p className="text-red-600 text-[13px] mb-4">* {errors.confirmPass}</p>}
                        </div>

                        <PrimaryButton type="submit" className="w-full mt-10">Register</PrimaryButton>
                    </form>

                </div>


            </div>
        </>
    )
}
