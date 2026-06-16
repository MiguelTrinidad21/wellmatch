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

    // useEffect(() => {
    //     if (!currentUser || Object.keys(currentUser).length === 0) {
    //         return
    //     }

    //     async function redirect() {
    //         try {
    //             await axios.get("/api/employer/authorize", {
    //                 params: {user: currentUser}
    //             });
    //             navigate("/employer/jobs");

    //         } catch {
    //             console.log(error)
    //         }
    //     }

    //     redirect()

        
    // }, [currentUser])

    return (
        <>
            <div className="w-full min-h-screen relative bg-[#F3F4F6] px-6">
                <PublicNavBar />
                <Overlay />

                <div className="w-full text-center py-10">
                    <h1 >Find the perfect skill fit</h1>
                    <h2>Connect with candidates who meet your exact requirements today.</h2>
                </div>

                <form onSubmit={handleSubmit} className="w-full bg-white rounded-3xl shadow-lg p-6">
                    <h2 className="text-center font-bold">Log in</h2>

                    <label className="block" htmlFor="email">Email Address</label>
                    <input 
                        type="email"
                        id="email"
                        value={employerCredentials.email}
                        onChange={(e) => setEmployerCredentials({...employerCredentials, email: e.target.value})}
                        placeholder="Enter email address"
                        required
                        className={`block w-full border ${errors.email ? 'border-red-600' : 'border-gray-300'}`}
                    />
                    {errors.email && <p className="text-red-600 text-[13px] italic">{errors.email}</p>}

                    <label className="block" htmlFor="password">Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id='password'
                            value={employerCredentials.password}
                            onChange={(e) => setEmployerCredentials({...employerCredentials, password: e.target.value})}
                            placeholder="Enter password"
                            required
                            className={`block w-full border ${errors.password ? 'border-red-600' : 'border-gray-300'}`}
                        />
                        <div onClick={handlePass} className="absolute top-1/2 -translate-y-1/2 right-2">
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </div>                        
                    </div>
                    {errors.password && <p className="text-red-600 text-[13px] italic">{errors.password}</p>}

                    <PrimaryButton type="submit" className="w-full">Sign in</PrimaryButton>
                </form>

                <p className="text-center text-sm mt-5">Don't have an account? 
                    <Link to="/employer/register"><span className="font-bold text-[#10B981]">&nbsp;&nbsp;Register here</span></Link>
                </p>
            </div>
            <Footer />
        </>
    )
}