import PublicNavBar from "../../components/navBars/PublicNavBar";
import Footer from "../../components/others/Footer";
import Overlay from "../../components/overlay/OverlayMobile";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import { useState, useEffect } from "react";
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";
import { useNavigate, Link } from "react-router-dom";
import { applicantVerifyCodeStore } from "../../zustand/codeVerification";
import api from "../../apis/axios";

export default function ApplicantRegister() {
    const navigate = useNavigate();
    const { setApplicantEmail } = applicantVerifyCodeStore();

    const [isChecked, setIsChecked] = useState(false);
    
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
    // const [showPopUp, setShowPopUp] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

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

                const response = await api.get(
                    "/geoapify/autocomplete",
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

    // function closePopUp() {
    //     setShowPopUp(false);
    //     navigate("/applicant/login");
    // }

    function handleCheckboxChange(event) {
        const checked = event.target.checked;
        setIsChecked(checked);
    };


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

        setIsLoading(true);

        try {
            await api.post("/applicant/register", applicantInfo);

            setApplicantEmail(applicantInfo.email);

            navigate("/applicant/register/verify");

        } catch (error) {
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (issue) {
                setErrors({ [issue]: message }); 
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            }

        } finally {
            setIsLoading(false)
        }

        // console.log(applicantInfo);

    }


    return (
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative p-6 md:p-15">
                <PublicNavBar />
                <Overlay />

                {locationSuggestions.length > 0 && <div onClick={() => setLocationSuggestions([])} className="fixed top-0 left-0 w-full h-full"></div>}

                {/* {showPopUp && (
                    <>
                        <Translucent />
                        <ConfirmationBox onClick={closePopUp} buttonText="Sign in" text="Account registered successfully" />
                    </>
                )} */}

                <form onSubmit={handleSubmit} className="m-auto w-full bg-white rounded-3xl shadow-lg p-6 md:w-100 lg:w-120">
                    <h2 className="text-center text-xl font-bold mb-5 md:text-2xl">Create your Account</h2>

                    <label className="block font-medium mb-1" htmlFor="firstName">First Name</label>
                    <input 
                        type="text"
                        id="firstName"
                        value={applicantInfo.firstName}
                        onChange={(e) => setApplicantInfo({...applicantInfo, firstName: e.target.value})}
                        placeholder="Enter first name"
                        minLength={2}
                        maxLength={50}
                        required
                        className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidFName ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                    />
                    {errors.invalidFName && <p className="text-red-600 text-[13px] mb-4">{errors.invalidFName}</p>}

                    <label className="block font-medium mb-1" htmlFor="lastName">Last Name</label>
                    <input 
                        type="text"
                        id="lastName"
                        value={applicantInfo.lastName}
                        onChange={(e) => setApplicantInfo({...applicantInfo, lastName: e.target.value})}
                        placeholder="Enter last name"
                        minLength={2}
                        maxLength={50}
                        required
                        className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidLName ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                    />
                    {errors.invalidLName && <p className="text-red-600 text-[13px] mb-4">{errors.invalidLName}</p>}

                    <label className="block font-medium mb-1" htmlFor="address">Address</label>
                    <div className="relative">
                        <input 
                            type="text"
                            id="address"
                            value={applicantInfo.address}
                            onChange={(e) => setApplicantInfo({...applicantInfo, address: e.target.value})}
                            placeholder="e.g. Tarlac City, Tarlac"
                            required
                            minLength={4}
                            maxLength={100}
                            autoComplete="off"
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidAddress ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {errors.invalidAddress && <p className="text-red-600 text-[13px] mb-4">{errors.invalidAddress}</p>}

                        {isSearchingLocation && (
                            <p className="absolute top-full left-0 mt-1 text-xs text-gray-500">
                                Searching locations...
                            </p>
                        )}

                        {locationSuggestions.length > 0 && (
                            <ul className="absolute z-30 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
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
                        minLength={5}
                        maxLength={100}
                        required
                        className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.email ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                    />
                    {errors.email && <p className="text-red-600 text-[13px] mb-4">{errors.email}</p>}

                    <label className="block font-medium mb-1" htmlFor="password">Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id='password'
                            value={applicantInfo.password}
                            onChange={(e) => setApplicantInfo({...applicantInfo, password: e.target.value})}
                            placeholder="Enter password"
                            required
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidPass ? "focus:border-red-600 border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        <div onClick={handlePass} className="absolute top-1/2 -translate-y-1/2 right-2 cursor-pointer">
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </div>               
                    </div>
                    {errors.invalidPass && <p className="text-red-600 text-[13px] mb-4">{errors.invalidPass}</p>}

                    <label className="block font-medium mb-1" htmlFor="confirmPass">Confirm Password</label>
                    <div className="relative">
                        <input 
                            type={showConfirmPassword ? "text" : "password"}
                            id='confirmPass'
                            value={applicantInfo.confirmPass}
                            onChange={(e) => setApplicantInfo({...applicantInfo, confirmPass: e.target.value})}
                            placeholder="Re-enter password"
                            required
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.confirmPassword ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`}
                        />
                        <div onClick={handleConfirmPass} className="absolute top-1/2 -translate-y-1/2 right-2 cursor-pointer">
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </div>
                    </div>
                    {errors.confirmPassword && <p className="text-red-600 text-[13px] mb-4">{errors.confirmPassword}</p>}


                    <div className="w-full text-[12px] m:text-[13px] lg:text-sm rounded-lg bg-slate-100 p-2 m:p-3 lg:p-5 mb-4">
                        <h1 className="font-bold mb-1 lg:mb-3 text-gray-800">TERMS AND CONDITIONS</h1>
                        <p className="font-medium text-gray-700">
                            <span>By creating a WellMatch account, you agree to our&nbsp;</span>
                            <Link to="/applicant/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Terms and Conditions</Link>
                            <span>&nbsp;and acknowledge our&nbsp;</span>
                            <Link to="/applicant/policies" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Privacy Policy</Link>.
                        </p>
                    </div>

                    <div className="w-full mb-4 flex items-start gap-2">
                        <input 
                            type="checkbox"
                            id="allow"
                            checked={isChecked}
                            onChange={handleCheckboxChange}                   
                            className="w-4 h-4 lg:w-5 lg:h-5 border border-gray-400 rounded-md"
                        />
                        <label htmlFor="allow" className={`text-[12px] text-gray-700 font-medium lg:text-sm cursor-pointer ${isChecked ? " duration-100 ease-out" : undefined}`}>I have read and agree to the Terms and Conditions and Privacy Policy.</label>
                    </div>                    

                    <PrimaryButton disabled={isLoading || !isChecked} type="submit" className={`w-full ${isLoading ? "opacity-60 cursor-progress" : undefined} ${!isChecked ? "opacity-60 cursor-not-allowed" : undefined}`}>
                        {isLoading ? 
                            <span className="flex items-center justify-center gap-2">
                                <BiLoaderAlt size={20} className="animate-spin" />
                                Register
                            </span>
                        : "Register"
                        }
                    </PrimaryButton>
                    {errors.general && <p className="text-red-600 my-2 text-sm text-center">{errors.general}</p>}
                </form>
            </div>
            {/* <Footer /> */}
        </>
    )
}