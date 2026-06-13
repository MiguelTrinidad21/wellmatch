import PublicNavBar from "../../components/navBars/PublicNavBar";
import Footer from "../../components/others/Footer";
import Overlay from "../../components/overlay/OverlayMobile";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import { useState } from "react";
import { MdFileUpload } from "react-icons/md";

export default function ApplicantRegister() {
    const [resumeFileName, setResumeFileName] = useState("");
    const [error, setError] = useState("");

    const [applicantInfo, setApplicantInfo] = useState({
        firstName: "",
        lastName: "",
        address: "",
        email: "",
        password: "",
        confirmPass: "",        
    })

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    const handleResumeChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setResumeFileName(null);
            setError("File size must not exceed 5MB.");

            e.target.value = "";
            return;
        }

        setResumeFileName(file.name);
        setError("");
    };


    return (
        <>
            <div className="w-screen h-screen bg-[#F9FAFB] relative px-6">
                <PublicNavBar />
                <Overlay />

                <form className="w-full bg-white rounded-3xl shadow-lg p-6">
                    <h2 className="text-center font-bold">Register Account</h2>

                    <label className="block" htmlFor="firstName">First Name</label>
                    <input 
                        type="text"
                        id="firstName"
                        onChange=''
                        placeholder="Enter first name"
                        required
                        className="block w-full"
                    />

                    <label className="block" htmlFor="lastName">Last Name</label>
                    <input 
                        type="text"
                        id="lastName"
                        onChange=''
                        placeholder="Enter last name"
                        required
                        className="block w-full"
                    />

                    <label className="block" htmlFor="address">Address</label>
                    <input 
                        type="text"
                        id="address"
                        onChange=''
                        placeholder="Enter address"
                        required
                        className="block w-full"
                    />

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

                    <h3>Resume</h3>
                    <p className="text-gray-500 text-xs">You may upload your resume for better job recommendations. Accepted file types: docx and pdf (5MB limit)</p>
                    
                    {resumeFileName && (
                        <p className="mb-2 text-sm font-medium text-gray-700">
                            {resumeFileName}
                        </p>
                    )}

                    {error && (
                        <p className="mb-2 text-sm font-medium text-red-500">
                            {error}
                        </p>
                    )}

                    <div>
                        <label className="cursor-pointer text-black font-semibold bg-[#86EFAC] rounded-full py-2 px-5 inline-flex" htmlFor="resume">
                            <MdFileUpload className="h-6 mr-3" />
                            {resumeFileName ? "Change Resume" : "  Upload"}
                            <input 
                                type="file"
                                id="resume"
                                required
                                accept=".docx, .pdf"
                                onChange={handleResumeChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <PrimaryButton onClick='' type="submit" className="w-full">Register</PrimaryButton>
                </form>
            </div>
            <Footer />
        </>
    )
}