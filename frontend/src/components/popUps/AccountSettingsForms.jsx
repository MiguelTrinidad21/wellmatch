import PrimaryButton from "../../components/buttons/PrimaryButton";
import Translucent from "../overlay/Translucent";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import { IoClose } from "react-icons/io5";
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";
import axios from "axios";


export function ChangeEmailForm({ toggleForm, confirmFunc }) {
    const { currentUser, handleCurrentUser } = userStore();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const [credentials, setCredentials] = useState({
        email: "",
        prevEmail: currentUser.email,
        password: ""
    });
    
    async function changeEmail(e) {
        e.preventDefault();
        setErrors({})

        const normalizedEmail = credentials.email.trim().toLowerCase();
        const normalizedPrevEmail = credentials.prevEmail.trim().toLowerCase();

        if (normalizedEmail === normalizedPrevEmail) {
            setErrors({ sameEmail: "Enter a new email address" });
            return;
        }

        setIsLoading(true);

        try {
            const updated = await axios.patch("/api/applicant/changeEmail", credentials, {
                withCredentials: true
            });

            handleCurrentUser(updated.data.user);
            toggleForm();
            confirmFunc();


        } catch (error) {
            console.log(error)
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (issue) {
                setErrors({ [issue]: message }); 
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            } 
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <Translucent />

            <div className="w-[85%] p-5 bg-[#F3F4F6] fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 rounded-2xl md:w-90">
                <IoClose onClick={toggleForm} size={25} className="cursor-pointer absolute top-2 right-2" />

                <h1 className="my-5 text-center font-bold text-xl">Change Email Address</h1>

                <form onSubmit={changeEmail} className="w-full">
                    <label className="block font-semibold mb-1" htmlFor="email">Email Address</label>
                    <input 
                        type="email"
                        id="email"
                        value={credentials.email}
                        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                        required
                        placeholder="Enter new email address"
                        className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-5 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.sameEmail ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                    />
                    {errors.sameEmail && <p className="text-sm text-red-600 mb-5">{errors.sameEmail}</p>}

                    <label className="block font-semibold mb-1" htmlFor="password">Password&nbsp;<span className="text-gray-500">(for verification)</span></label>
                    <div className={`w-full relative ${errors.password ? "mb-1" : "mb-5"}`}>
                        <input 
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={credentials.password}
                            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            required
                            placeholder="Enter current password"
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-5 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.password ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {
                            showPassword ?
                                <FiEyeOff 
                                    size={15}
                                    onClick={() => setShowPassword(false)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />
                            :
                                <FiEye 
                                    size={15}
                                    onClick={() => setShowPassword(true)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />                                
                        }
                    </div>
                    {errors.password && <p className="text-sm text-red-600 mb-5">{errors.password}</p>}

                    <div className="flex justify-end gap-3">
                        <PrimaryButton disabled={isLoading} className={`bg-[#F3F4F6] text-black! ${isLoading ? "opacity-50" : undefined}`} onClick={toggleForm}>Cancel</PrimaryButton>
                        <PrimaryButton disabled={isLoading} type="submit" className={isLoading ? "opacity-50" : undefined}>
                            {
                                isLoading ?
                                    <span className="flex items-center gap-2">
                                        <BiLoaderAlt size={20} className="animate-spin" />
                                        Update
                                    </span>
                                :
                                    "Update"
                            }
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </>
    )
}

export function ChangePasswordForm({ toggleForm, confirmFunc }) {
    const { currentUser, handleCurrentUser } = userStore();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showCurrPassword, setShowCurrPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showRetypePassword, setShowRetypePassword] = useState(false);

    const [credentials, setCredentials] = useState({
        currentPassword: "",
        newPassword: "",
        retypePassword: ""
    });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{12,}$/;
    
    async function changePassword(e) {
        e.preventDefault();
        setErrors({})

        const { currentPassword, newPassword, retypePassword } = credentials;

        if (!passwordRegex.test(newPassword)) {
            setErrors({
                invalidPass: "Password must be 12+ characters with uppercase, lowercase, and special characters."                
            })
            setIsLoading(false)
            return;
        }

        if (newPassword !== retypePassword) {
            setErrors({ notMatch: "Password did not match" })
            setIsLoading(false)
            return
        }

        setIsLoading(true);

        try {
            const updated = await axios.patch("/api/applicant/changePassword", credentials, {
                withCredentials: true
            });

            toggleForm();
            confirmFunc();

        } catch (error) {
            console.log(error)
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (issue) {
                setErrors({ [issue]: message }); 
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            } 
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <Translucent />

            <div className="w-[85%] p-5 bg-[#F3F4F6] fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 rounded-2xl md:w-90">
                <IoClose onClick={toggleForm} size={25} className="cursor-pointer absolute top-2 right-2" />

                <h1 className="my-5 text-center font-bold text-xl">Change Password</h1>

                <form onSubmit={changePassword} className="w-full">
                    <label className="block font-semibold mb-1" htmlFor="currentPass">Current Password</label>
                    <div className={`w-full relative ${errors.incorrectPass ? "mb-1" : "mb-5"}`}>
                        <input 
                            type={showCurrPassword ? "text" : "password"}
                            id="currentPass"
                            value={credentials.currentPassword}
                            onChange={(e) => setCredentials({...credentials, currentPassword: e.target.value})}
                            required
                            placeholder="Enter current password"
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-5 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.incorrectPass ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {
                            showCurrPassword ?
                                <FiEyeOff 
                                    size={15}
                                    onClick={() => setShowCurrPassword(false)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />
                            :
                                <FiEye 
                                    size={15}
                                    onClick={() => setShowCurrPassword(true)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />                                
                        }
                    </div>
                    {errors.incorrectPass && <p className="text-sm text-red-600 mb-5">{errors.incorrectPass}</p>}


                    <label className="block font-semibold mb-1">New Password</label>
                    <div className={`w-full relative mb-2`}>
                        <input 
                            type={showNewPassword ? "text" : "password"}
                            id="newPass"
                            value={credentials.newPassword}
                            onChange={(e) => setCredentials({...credentials, newPassword: e.target.value})}
                            required
                            placeholder="Enter new password"
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-5 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidPass ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {
                            showNewPassword ?
                                <FiEyeOff 
                                    size={15}
                                    onClick={() => setShowNewPassword(false)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />
                            :
                                <FiEye 
                                    size={15}
                                    onClick={() => setShowNewPassword(true)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />                                
                        }
                    </div>
                    {errors.invalidPass && <p className="text-[12px] text-red-600 mb-5">{errors.invalidPass}</p>}


                    <div className={`w-full relative ${errors.notMatch ? "mb-1" : "mb-5"}`}>
                        <input 
                            type={showRetypePassword ? "text" : "password"}
                            id="retypePass"
                            value={credentials.retypePassword}
                            onChange={(e) => setCredentials({...credentials, retypePassword: e.target.value})}
                            required
                            placeholder="Confirm new password"
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-5 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.notMatch ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {
                            showRetypePassword ?
                                <FiEyeOff 
                                    size={15}
                                    onClick={() => setShowRetypePassword(false)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />
                            :
                                <FiEye 
                                    size={15}
                                    onClick={() => setShowRetypePassword(true)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />                                
                        }
                    </div>
                    {errors.notMatch && <p className="text-sm text-red-600 mb-5">{errors.notMatch}</p>}



                    <div className="flex justify-end gap-3">
                        <PrimaryButton disabled={isLoading} className={`bg-[#F3F4F6] text-black! ${isLoading ? "opacity-50" : undefined}`} onClick={toggleForm}>Cancel</PrimaryButton>
                        <PrimaryButton disabled={isLoading} type="submit" className={isLoading ? "opacity-50" : undefined}>
                            {
                                isLoading ?
                                    <span className="flex items-center gap-2">
                                        <BiLoaderAlt size={20} className="animate-spin" />
                                        Update
                                    </span>
                                :
                                    "Update"
                            }
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </>
    )
}


export function DeleteAccountForm({ toggleForm, confirmFunc }) {
    const { currentUser, handleCurrentUser } = userStore();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const [credentials, setCredentials] = useState({
        email: "",
        password: ""
    });

    
    async function deleteAccount(e) {
        e.preventDefault();
        setIsLoading(true);
        setErrors({})


        try {
            const updated = await axios.delete("/api/applicant/deleteAccount", {
                params: {
                    email: credentials.email,
                    password: credentials.password
                },
                withCredentials: true
            }                
            );

            toggleForm();
            confirmFunc();

        } catch (error) {
            console.log(error)
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (issue) {
                setErrors({ [issue]: message }); 
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            } 
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <Translucent />

            <div className="w-[85%] p-5 bg-[#F3F4F6] fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 rounded-2xl md:w-90">
                <IoClose onClick={toggleForm} size={25} className="cursor-pointer absolute top-2 right-2" />

                <h1 className="my-5 text-center font-bold text-xl">Delete Account</h1>

                <h2 className="font-semibold text-[16px]">We're sorry to see you go</h2>
                <p className="mb-5 text-sm text-gray-600">Deleting your account will remove your profile, resumes, and personal information from WellMatch. Your job applications will remain on record for employers but will be disassociated from your account.</p>

                <form onSubmit={deleteAccount} className="w-full">
                    <label className="block font-semibold mb-1" htmlFor="email">Email Address</label>
                    <div className={`w-full relative`}>
                        <input 
                            type="email"
                            id="email"
                            value={credentials.email}
                            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                            required
                            placeholder="Enter email address"
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-5 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.email ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                    </div>
                    {errors.email && <p className="text-[13px] text-red-600 mb-5">{errors.email}</p>}


                    <label htmlFor="password" className="block font-semibold mb-1">Password</label>
                    <div className={`w-full relative mb-2`}>
                        <input 
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={credentials.password}
                            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            required
                            placeholder="Enter password"
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-5 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.password ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {
                            showPassword ?
                                <FiEyeOff 
                                    size={15}
                                    onClick={() => setShowPassword(false)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />
                            :
                                <FiEye 
                                    size={15}
                                    onClick={() => setShowPassword(true)}
                                    className="cursor-pointer absolute top-1/2 -translate-y-1/2 right-3" 
                                />                                
                        }
                    </div>
                    {errors.password && <p className="text-[13px] text-red-600 mb-5">{errors.password}</p>}


                    <div className="flex justify-end gap-3">
                        <PrimaryButton disabled={isLoading} className={`bg-[#F3F4F6] text-black! ${isLoading ? "opacity-50" : undefined}`} onClick={toggleForm}>Cancel</PrimaryButton>
                        <PrimaryButton disabled={isLoading} type="submit" className={`bg-red-600 ${isLoading ? "opacity-50" : undefined}`}>
                            {
                                isLoading ?
                                    <span className="flex items-center gap-2">
                                        <BiLoaderAlt size={20} className="animate-spin" />
                                        Delete
                                    </span>
                                :
                                    "Delete"
                            }
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </>
    )
}
