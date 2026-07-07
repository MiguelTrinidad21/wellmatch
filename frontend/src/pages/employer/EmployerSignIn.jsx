import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicNavBar from "../../components/navBars/PublicNavBar.jsx";
import Overlay from "../../components/overlay/OverlayMobile.jsx";
import PrimaryButton from "../../components/buttons/PrimaryButton.jsx";
import Footer from "../../components/others/Footer.jsx";
import axios from "axios";
import { userStore } from "../../zustand/userState.js";
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";

export default function EmployerSignIn() {
    const navigate = useNavigate();
    const { currentUser, handleCurrentUser } = userStore();

    const [employerCredentials, setEmployerCredentials] = useState({email: "", password: ""});
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    function handlePass(e) {
        setShowPassword(!showPassword);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});

        try {
            const signedToken = await axios.post("/api/employer/login", employerCredentials, {
                withCredentials: true
            })

            const loggedEmployer = signedToken.data.user;
            console.log(loggedEmployer)
            handleCurrentUser(loggedEmployer);
            // console.log(currentUser)

            navigate("/employer/jobs");

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

    return (
        <>
            <div className="w-full min-h-screen relative bg-[#F3F4F6] px-6">
                <PublicNavBar />
                <Overlay />

                <div className="grid grid-cols-1 w-full">
                    <div className="w-full text-center py-10">
                        <h1 className="text-3xl pb-2 font-extrabold bg-linear-to-r from-[#166534] via-[#16A34A] to-[#4ADE80] bg-clip-text text-transparent mb-2 md:text-5xl md:mb-5" >Hire the Right Talent</h1>
                        <h2 className="font-semibold md:text-xl">Connect with top talent built for your team.</h2>
                    </div>

                    <div>
                        <form onSubmit={handleSubmit} className="m-auto w-full bg-white rounded-3xl shadow-lg p-6 md:w-100">
                            <h2 className="text-center font-bold text-xl mb-4 md:text-2xl">Sign in</h2>

                            <label className="block mb-1 font-medium" htmlFor="email">Email Address</label>
                            <input 
                                type="email"
                                id="email"
                                value={employerCredentials.email}
                                onChange={(e) => setEmployerCredentials({...employerCredentials, email: e.target.value})}
                                placeholder="Enter email address"
                                required
                                className={`p-2 rounded-md block w-full border-2 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600 md:mb-6 ${errors.email ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`}
                            />
                            {errors.email && <p className="text-red-600 text-[13px] mb-4">* {errors.email}</p>}

                            <label className="block mb-1 font-medium" htmlFor="password">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id='password'
                                    value={employerCredentials.password}
                                    onChange={(e) => setEmployerCredentials({...employerCredentials, password: e.target.value})}
                                    placeholder="Enter password"
                                    required
                                    className={`p-2 rounded-md block w-full border-2 mb-4 md:mb-6 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600 ${errors.password ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`}
                                />
                                <div onClick={handlePass} className="absolute top-1/2 -translate-y-1/2 right-2">
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </div>                        
                            </div>
                            {errors.password && <p className="text-red-600 text-[13px] mb-4">* {errors.password}</p>}

                            <PrimaryButton type="submit" className="w-full">Sign in</PrimaryButton>

                            <p className="text-center text-sm mt-5">Don't have an account? 
                                <Link to="/employer/register"><span className="font-bold text-[#10B981]">&nbsp;&nbsp;Register here</span></Link>
                            </p>
                        </form>

                    </div>

                </div>

                

            </div>
            <Footer />
        </>
    )
}