import PublicNavBar from "../../components/navBars/PublicNavBar";
import Footer from "../../components/others/Footer";
import Overlay from "../../components/overlay/OverlayMobile";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import Translucent from "../../components/overlay/Translucent";
import { useState, useEffect } from "react";
import { MdFileUpload } from "react-icons/md";
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ApplicantRegister() {
    const navigate = useNavigate();
    
    const [applicantInfo, setApplicantInfo] = useState({
        firstName: "",
        lastName: "",
        address: "",
        email: "",
        password: "",
        confirmPass: "",        
    })

    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [isLocationSelected, setIsLocationSelected] = useState(false);
    const [lastSelectedLocation, setLastSelectedLocation] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const [resume, setResume] = useState(null);
    const [resumeFileName, setResumeFileName] = useState("");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{12,}$/;

    useEffect(() => {
        if (isLocationSelected && lastSelectedLocation === applicantInfo.address) {
            return;
        } else {
            setIsLocationSelected(false);
        }

        const searchText = applicantInfo.address.trim();

        if (searchText.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        const delay = setTimeout(async () => {
            try {
                setIsSearchingLocation(true);

                const response = await axios.get(
                    "/api/geoapify/autocomplete",
                    {
                        params: {
                            text: searchText.trim()
                        }
                    }
                );

                setLocationSuggestions(response.data.suggestions);
            } catch (error) {
                console.error(error.response?.data || error.message);
                setLocationSuggestions([]);
            } finally {
                setIsSearchingLocation(false);
            }
        }, 500);

        return () => clearTimeout(delay);
    }, [applicantInfo.address, isLocationSelected]);

    function handleSelectLocation(place) {
        const formatted = [
            place.city,
            place.state
        ].filter(Boolean).join(", ");

        setApplicantInfo((prev) => ({
            ...prev,
            address: formatted
        }));

        setLastSelectedLocation(formatted);

        setLocationSuggestions([]);
    }

    function handlePass(e) {
        setShowPassword(!showPassword);
    }

    function handleConfirmPass(e) {
        setShowConfirmPassword(!showConfirmPassword);
    }

    function closePopUp() {
        setShowPopUp(false);
        navigate("/applicant/login");
    }


    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});

        if (!passwordRegex.test(applicantInfo.password)) {
            setErrors({
                invalidPass: "Password must be 12+ characters with uppercase, lowercase, and special characters."                
            })
            return
        }

        if (applicantInfo.password !== applicantInfo.confirmPass) {
            setErrors({ confirmPassword: "Passwords did not match" });
            return;
        }

        const formData = new FormData();

        formData.append("firstName", applicantInfo.firstName);
        formData.append("lastName", applicantInfo.lastName);
        formData.append("address", applicantInfo.address);
        formData.append("email", applicantInfo.email);
        formData.append("password", applicantInfo.password);

        if (!resume) {
            return setErrors({noResume: "Please upload a resume."});
        }
        
        formData.append("resume", resume);

        setIsLoading(true);

        try {
            await axios.post("/api/applicant/register", formData, {
                withCredentials: true,
            })

            setIsLoading(false)
            setShowPopUp(true);

        } catch (error) {
            setIsLoading(false)
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (issue) {
                setErrors({ [issue]: message }); 
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            }
        }

        // console.log(applicantInfo);

    }


    return (
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative p-6 md:p-15">
                <PublicNavBar />
                <Overlay />

                {showPopUp && (
                    <>
                        <Translucent />
                        <ConfirmationBox onClick={closePopUp} buttonText="Sign in" text="Account registered successfully" />
                    </>
                )}

                <form onSubmit={handleSubmit} className="m-auto w-full bg-white rounded-3xl shadow-lg p-6 md:w-100 ">
                    <h2 className="text-center text-xl font-bold mb-5 md:text-2xl">Register Account</h2>

                    <label className="block font-medium mb-1" htmlFor="firstName">First Name</label>
                    <input 
                        type="text"
                        id="firstName"
                        value={applicantInfo.firstName}
                        onChange={(e) => setApplicantInfo({...applicantInfo, firstName: e.target.value})}
                        placeholder="Enter first name"
                        required
                        className="p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600"
                    />

                    <label className="block font-medium mb-1" htmlFor="lastName">Last Name</label>
                    <input 
                        type="text"
                        id="lastName"
                        value={applicantInfo.lastName}
                        onChange={(e) => setApplicantInfo({...applicantInfo, lastName: e.target.value})}
                        placeholder="Enter last name"
                        required
                        className="p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600"
                    />

                    <label className="block font-medium mb-1" htmlFor="address">Address</label>
                    <div className="relative">
                        <input 
                            type="text"
                            id="address"
                            value={applicantInfo.address}
                            onChange={(e) => setApplicantInfo({...applicantInfo, address: e.target.value})}
                            placeholder="e.g. Tarlac City, Tarlac"
                            required
                            autoComplete="off"
                            className="p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600 overflow-x-scroll"
                        />

                        {isSearchingLocation && (
                            <p className="mt-1 text-xs text-gray-500">
                                Searching locations...
                            </p>
                        )}

                        {locationSuggestions.length > 0 && (
                            <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                                {locationSuggestions.map((place) => (
                                    <li
                                        key={place.placeId}
                                        onClick={() => {
                                            setIsLocationSelected(!isLocationSelected)
                                            handleSelectLocation(place)
                                        }}
                                        className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                                    >
                                        {[
                                            place.city,
                                            place.state
                                        ].filter(Boolean).join(", ")}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <label className="block font-medium mb-1" htmlFor="email">Email Address</label>
                    <input 
                        type="email"
                        id="email"
                        value={applicantInfo.email}
                        onChange={(e) => setApplicantInfo({...applicantInfo, email: e.target.value})}
                        placeholder="name@example.com"
                        required
                        className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600 ${errors.email ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                    />
                    {errors.email && <p className="text-red-600 text-[13px] mb-4">* {errors.email}</p>}

                    <label className="block font-medium mb-1" htmlFor="password">Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id='password'
                            value={applicantInfo.password}
                            onChange={(e) => setApplicantInfo({...applicantInfo, password: e.target.value})}
                            placeholder="Enter password"
                            required
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600 ${errors.invalidPass ? "focus:border-red-600 border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        <div onClick={handlePass} className="absolute top-1/2 -translate-y-1/2 right-2">
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </div>               
                    </div>
                    {errors.invalidPass && <p className="text-red-600 text-[13px] mb-4">* {errors.invalidPass}</p>}

                    <label className="block font-medium mb-1" htmlFor="confirmPass">Confirm Password</label>
                    <div className="relative">
                        <input 
                            type={showConfirmPassword ? "text" : "password"}
                            id='confirmPass'
                            value={applicantInfo.confirmPass}
                            onChange={(e) => setApplicantInfo({...applicantInfo, confirmPass: e.target.value})}
                            placeholder="Re-enter password"
                            required
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-gray-600 ${errors.confirmPassword ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`}
                        />
                        <div onClick={handleConfirmPass} className="absolute top-1/2 -translate-y-1/2 right-2">
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </div>
                    </div>
                    {errors.confirmPassword && <p className="text-red-600 text-[13px] mb-4">* {errors.confirmPassword}</p>}
                    

                    <h3 className="block font-medium mb-1">Resume</h3>
                    <p className="text-gray-500 text-xs mb-2">Accepted file types: docx and pdf (5MB limit)</p>
                    
                    {resumeFileName && (
                        <p className="mb-2 text-sm font-medium text-gray-700">
                            {resumeFileName}
                        </p>
                    )}

                    {errors.noResume && <p className="text-red-600 text-[13px] my-2">* {errors.noResume}</p>}
                    {errors.fileType && <p className="text-red-600 text-[13px] my-2">* {errors.fileType}</p>}
                    {errors.fileSize && <p className="text-red-600 text-[13px] my-2">* {errors.fileSize}</p>}

                    <div className="mb-5">
                        <label className="cursor-pointer text-black text-sm font-semibold bg-[#86EFAC] rounded-lg py-2 px-5 inline-flex mb-5" htmlFor="resume">
                            <MdFileUpload className="h-6 mr-3" />
                            {resumeFileName ? "Change" : "  Upload"}
                            <input 
                                type="file"
                                id="resume"
                                accept=".docx, .pdf"
                                onChange={(e) => {
                                    const file = e.target.files[0]

                                    if (!file) return;

                                    setResume(file)
                                    setResumeFileName(file.name)
                                }}
                                className="hidden"
                            />
                        </label>

                    </div>

                    <PrimaryButton disabled={isLoading} type="submit" className={`w-full ${isLoading && "opacity-60"}`}>
                        {isLoading ? 
                            <span className="flex items-center justify-center gap-2">
                                <BiLoaderAlt size={20} className="animate-spin" />
                                Register
                            </span>
                        : "Register"
                        }
                    </PrimaryButton>
                    {errors.general && <p className="text-red-600 my-2 text-sm">{errors.general}</p>}
                </form>
            </div>
            <Footer />
        </>
    )
}