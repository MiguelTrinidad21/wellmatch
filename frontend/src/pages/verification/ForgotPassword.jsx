import PrimaryButton from "../../components/buttons/PrimaryButton";
import { useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";
import api from "../../apis/axios";
import Translucent from "../../components/overlay/Translucent";

export default function ForgotPassword({ userType, cancelFunc, setPasswordReset }) {
    const isApplicant = userType === "applicant"

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [isSending, setIsSending] = useState(false);
    const [errors, setErrors] = useState({});

    const [showSendCode, setShowSendCode] = useState(true);
    const [showVerifyCode, setShowVerifyCode] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{12,}$/;

    
    async function sendEmailCode(e) {
        e.preventDefault();

        try {
            setIsSending(true);

            if (isApplicant) {
                await api.post(
                    "/applicant/forgotPassword",
                    { email }
                );
                
            } else {
                await api.post(
                    "/employer/forgotPassword",
                    { email }
                );
            }


            setErrors({});
            setShowSendCode(false);
            setShowVerifyCode(true);


        } catch (error) {
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";
            const status = error.response?.status

            if (status === 429) {
                setErrors({
                    rateLimit: message
                });
            } else if (issue) {
                setErrors({
                    [issue]: message
                });
            } else {
                setErrors({
                    general: "Unable to connect to the server. Please try again."
                });
            }

        } finally {
            setIsSending(false);
        }
    }

    async function verifyEmailCode(e) {
        e.preventDefault();

        if (!code || code.trim().length !== 6) {
            setErrors({ invalid: "Enter the 6-digit code" });
            return;
        }

        setIsSending(true);

        try {
            if (isApplicant) {
                await api.post("/applicant/forgotPassword/verifyCode", { code, email });
                
            } else {
                await api.post("/employer/forgotPassword/verifyCode", { code, email });
            }

            setErrors({});
            setShowVerifyCode(false);
            setShowResetPassword(true);

                    
        } catch (error) {
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";
            const status = error.response?.status

            if (status === 429) {
                setErrors({
                    rateLimit: message
                });
            } else if (issue) {
                setErrors({
                    [issue]: message
                });
            } else {
                setErrors({
                    general: "Unable to connect to the server. Please try again."
                });
            }

        } finally {
            setIsSending(false);
        }
    }


    async function changePassword(e) {
        e.preventDefault();

        if (!passwordRegex.test(newPassword)) {
            setErrors({
                invalidPass: "Password must be 12+ characters with uppercase, lowercase, a number, and special characters."                
            })
            return
        }

        setIsSending(true);

        try {
            if (isApplicant) {
                await api.post("/applicant/forgotPassword/verifyCode/resetPassword", { newPassword, email });
                
            } else {
                await api.post("/employer/forgotPassword/verifyCode/resetPassword", { newPassword, email });

            }

            setErrors({});
            setPasswordReset();
            cancelFunc();

            
        } catch (error) {
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";
            const status = error.response?.status

            if (status === 429) {
                setErrors({
                    rateLimit: message
                });
            } else if (issue) {
                setErrors({
                    [issue]: message
                });
            } else {
                setErrors({
                    general: "Unable to connect to the server. Please try again."
                });
            }
            
        } finally {
            setIsSending(false);
        }
    }



    return (
        <>
            <Translucent />

            <div className="fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-40 w-[90%] h-100 max-h-[90%] overflow-y-scroll scrollbar-none md:w-150 md:h-150 rounded-2xl bg-white shadow-md p-6 md:py-15 md:px-25">
                <button 
                    disabled={isSending} 
                    onClick={() => cancelFunc(false)} 
                    className={`absolute right-5 top-5 cursor-pointer ${isSending && "cursor-not-allowed"}`}>
                    <IoMdClose className="h-7 w-7" />
                </button>
                
                {
                    showSendCode &&
                    <>
                        <h1 className="font-bold text-xl md:text-3xl mb-5 mt-10">Find your account</h1>
                        <h2 className="text-gray-600 font-medium mb-6">Enter your registered email address to reset your password</h2>

                        <form onSubmit={sendEmailCode}>
                            <input 
                                type="email" 
                                id="email"
                                placeholder="email@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                minLength={5}
                                maxLength={100}
                                className={`p-2 lg:px-4 rounded-md block w-full border-2 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out ${errors.email ? "border-red-600 focus:border-red-600" : "border-gray-300 focus:border-green-600"}`} 
                            />
                            {errors.email && <p className="text-red-600 text-[13px] text-center mb-3">{errors.email}</p>}
                            {errors.rateLimit && <p className="text-red-600 text-[13px] mb-4 text-center">{errors.rateLimit}</p>}

                            <PrimaryButton className={`w-full mb-5 ${isSending && "opacity-50 cursor-progress!"}`} type="submit" disabled={isSending}>
                                {isSending ? 
                                    <>
                                        <BiLoaderAlt className="animate-spin mr-3 inline" />
                                        Sending code...
                                    </>
                                : "Continue"}
                                
                            </PrimaryButton>
                        </form>                  
                    </>
                }


                {
                    showVerifyCode &&
                    <>
                        <h1 className="font-bold text-xl md:text-3xl mb-5 mt-10">Check your email</h1>
                        <h2 className="text-gray-600 font-medium mb-6">Please enter the 6-digit code we sent to <b>{email}</b>  to reset your password</h2>

                        <form onSubmit={verifyEmailCode}>
                            <input 
                                type="text" 
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="Confirmation code"
                                autoComplete="off"
                                inputMode="numeric"
                                minLength={1}
                                maxLength={6}
                                className={`p-2 rounded-lg block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${
                                    errors.invalid ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"
                                }`}
                            />
                            {errors.invalid && <p className="text-red-600 text-[13px] mb-4">{errors.invalid}</p>}

                            {errors.rateLimit && <p className="text-red-600 text-[13px] mb-4 text-center">{errors.rateLimit}</p>}

                            <PrimaryButton className={`w-full mb-5 ${isSending && "opacity-50 cursor-progress!"}`} type="submit" disabled={isSending}>
                                {isSending ? 
                                    <>
                                        <BiLoaderAlt className="animate-spin mr-3 inline" />
                                        Verifying...
                                    </>
                                : "Submit"}
                                
                            </PrimaryButton>
                        </form>                  
                    </>
                }


                {
                    showResetPassword &&
                    <>
                        <h1 className="font-bold text-xl md:text-3xl mb-5 mt-10">Choose a new password</h1>
                        <h2 className="text-gray-600 font-medium mb-6">Use at least 12 characters with uppercase, lowercase, a number, and a special character.</h2>

                        <form onSubmit={changePassword}>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id='password'
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    minLength={12}
                                    maxLength={72}
                                    className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidPass ? "focus:border-red-600 border-red-600 mb-1!" : "border-gray-300"}`}
                                />
                                <div onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 right-2 cursor-pointer">
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </div>               
                            </div>
                            {errors.invalidPass && <p className="text-red-600 text-[13px] mb-4">{errors.invalidPass}</p>}


                            <PrimaryButton className={`w-full mb-5 ${isSending && "opacity-50 cursor-progress!"}`} type="submit" disabled={isSending}>
                                {isSending ? 
                                    <>
                                        <BiLoaderAlt className="animate-spin mr-3 inline" />
                                        Resetting Password...
                                    </>
                                : "Continue"}
                                
                            </PrimaryButton>
                        </form>                  
                    </>
                }


                


            </div>             
 
        </>
    )
}