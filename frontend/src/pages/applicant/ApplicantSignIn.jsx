import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicNavBar from "../../components/navBars/PublicNavBar.jsx";
import Overlay from "../../components/overlay/OverlayMobile.jsx";
import PrimaryButton from "../../components/buttons/PrimaryButton.jsx";
import Footer from "../../components/others/Footer.jsx";

export default function ApplicantSignIn() {
    const navigate = useNavigate();

    return (
        <>
            <div className="w-screen h-screen relative bg-[#F9FAFB] px-6">
                <PublicNavBar />
                <Overlay />

                <div className="w-full text-center py-10">
                    <h1 >Bridge the Gap</h1>
                    <h2>Match your profile to top roles and level up</h2>
                </div>

                <form className="w-full bg-white rounded-3xl shadow-lg p-6">
                    <h2 className="text-center font-bold">Sign in</h2>

                    <label className="block" htmlFor="email">Email Address</label>
                    <input 
                        type="email"
                        id="email"
                        onChange=''
                        placeholder="Enter email address"
                        required
                        className="block w-full"
                    />

                    <label className="block" htmlFor="password">Password</label>
                    <input 
                        type="password" 
                        id='password'
                        onChange=''
                        placeholder="Enter password"
                        required
                        className="block w-full"
                    />

                    <PrimaryButton onClick='' type="submit" className="w-full">Sign in</PrimaryButton>
                </form>
                <p className="text-center text-sm mt-5">
                    <Link to="/applicant/register">Don't have an account?
                        <span className="font-bold text-[#10B981]">&nbsp;&nbsp;Register here</span>
                    </Link>
                </p>
            </div>
            <Footer />
        </>
    );
}