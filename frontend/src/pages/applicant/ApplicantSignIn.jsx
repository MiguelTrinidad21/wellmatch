import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicNavBar from "../../components/navBars/PublicNavBar.jsx";
import Overlay from "../../components/overlay/OverlayMobile.jsx";
import PrimaryButton from "../../components/buttons/PrimaryButton.jsx";
import Footer from "../../components/others/Footer.jsx";
import axios from "axios";
import { userStore } from "../../zustand/userState.js";
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";

export default function ApplicantSignIn() {
    const navigate = useNavigate();
    const { handleCurrentUser } = userStore();

    const [applicantCredentials, setApplicantCredentials] = useState({
        email: "",
        password: ""
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    function handlePass(e) {
        setShowPassword(!showPassword);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});

        try {
            const signedToken = await axios.post("/api/applicant/login", applicantCredentials, {
                withCredentials: true
            })

            const loggedApplicant = signedToken.data.user;
            // console.log(loggedApplicant)
            handleCurrentUser(loggedApplicant);

            navigate("/applicant/findJobs", { replace: true });

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
            <div className="w-screen h-screen relative bg-[#F3F4F6] px-6 md:px-15">
                <PublicNavBar />
                <Overlay />

                <div className="grid grid-cols-1 w-full justify-items-center">
                    <div className="w-full text-center my-10">
                        <h1 className="text-3xl font-extrabold bg-linear-to-r from-[#166534] via-[#16A34A] to-[#4ADE80] bg-clip-text text-transparent mb-2 md:text-5xl md:mb-5">BRIDGE THE GAP</h1>
                        <h2 className="font-semibold md:text-xl">Match your profile to top roles and level up</h2>
                    </div>


                    <form onSubmit={handleSubmit} className="w-full bg-white rounded-3xl shadow-lg p-6 md:w-100">
                        <h2 className="text-center font-bold text-xl mb-4 md:text-2xl">Sign in</h2>

                        <label className="block mb-1 font-medium" htmlFor="email">Email Address</label>
                        <input 
                            type="email"
                            id="email"
                            value={applicantCredentials.email}
                            onChange={(e) => setApplicantCredentials({...applicantCredentials, email: e.target.value})}
                            placeholder="Enter email address"
                            required
                            className={`p-2 rounded-md block w-full border-2 mb-4 md:mb-6 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600 ${errors.email ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`}
                        />
                        {errors.email && <p className="text-red-600 text-[13px] mb-4">* {errors.email}</p>}

                        <label className="block mb-1 font-medium" htmlFor="password">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id='password'
                                value={applicantCredentials.password}
                                onChange={(e) => setApplicantCredentials({...applicantCredentials, password: e.target.value})}
                                placeholder="Enter password"
                                required
                                className={`p-2 rounded-md block w-full border-2 mb-4 md:mb-6 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600 ${errors.password ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`}
                            />
                            <div onClick={handlePass} className="absolute top-1/2 -translate-y-1/2 right-2">
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </div>                        
                        </div>
                        {errors.password && <p className="text-red-600 text-[13px] mb-4">* {errors.password}</p>}

                        <PrimaryButton type="submit" className="w-full mb-6">Sign in</PrimaryButton>

                        <p className="text-center text-sm mt-5">
                            <Link to="/applicant/register">Don't have an account?
                                <span className="font-bold text-[#10B981]">&nbsp;&nbsp;Register here</span>
                            </Link>
                        </p>

                    </form>
                        

                </div>

            </div>
            <Footer />
        </>
    );
}