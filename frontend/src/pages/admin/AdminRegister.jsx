import PublicNavBar from "../../components/navBars/PublicNavBar";
import Footer from "../../components/others/Footer";
import Overlay from "../../components/overlay/OverlayMobile";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import { useState, useEffect } from "react";
import axios from 'axios'
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import Translucent from "../../components/overlay/Translucent";

export default function AdminRegister() {
    const navigate = useNavigate();

    const [adminInfo, setAdminInfo] = useState({
        firstName: "",
        lastName: "",
        emailAddress: "",
        password: "",
        confirmPassword: "",
        companyName: "",
        companyLocation: "",
        role: "",
        status: ""
    });

    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [isLocationSelected, setIsLocationSelected] = useState(false);
    const [lastSelectedLocation, setLastSelectedLocation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);
    const [errors, setErrors] = useState({});
    


    useEffect(() => {
        if (isLocationSelected && lastSelectedLocation === adminInfo.companyLocation) {
            return;
        } else {
            setIsLocationSelected(false);
        }

        const searchText = adminInfo.companyLocation.trim();

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
    }, [adminInfo.companyLocation, isLocationSelected]);

    function handleSelectLocation(place) {
        const formatted = [
            place.city,
            place.state
        ].filter(Boolean).join(", ");

        setAdminInfo((prev) => ({
            ...prev,
            companyLocation: formatted
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
        navigate("/employer/login");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});

        if (adminInfo.password !== adminInfo.confirmPassword) {
            setErrors({ confirmPassword: "Passwords do not match" });
            return;
        }

        try {
            await axios.post("/api/employer/register", adminInfo, {
                withCredentials: true
            })
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

        // console.log(adminInfo);

    }

    return (
        <>
            <div className="w-full min-h-screen bg-[#F9FAFB] relative px-6">
                <PublicNavBar />
                <Overlay />
                {showPopUp && (
                    <>
                        <Translucent />
                        <ConfirmationBox onClick={closePopUp} text="Account registered successfully" />
                    </>
                )}

                <form className="w-full bg-white rounded-3xl shadow-lg p-6 mt-6" onSubmit={handleSubmit}>
                    <h2 className="text-center font-bold">Register Account</h2>

                    <label className="block" htmlFor="firstName">First Name</label>
                    <input 
                        type="text"
                        id="firstName"
                        value={adminInfo.firstName}
                        onChange={(e) => setAdminInfo({...adminInfo, firstName: e.target.value})}
                        placeholder="Enter first name"
                        required
                        className="block w-full"
                    />

                    <label className="block" htmlFor="lastName">Last Name</label>
                    <input 
                        type="text"
                        id="lastName"
                        value={adminInfo.lastName}
                        onChange={(e) => setAdminInfo({...adminInfo, lastName: e.target.value})}
                        placeholder="Enter last name"
                        required
                        className="block w-full"
                    />

                    <label className="block" htmlFor="email">Email Address</label>
                    <input 
                        type="email"
                        id="email"
                        value={adminInfo.emailAddress}
                        onChange={(e) => setAdminInfo({...adminInfo, emailAddress: e.target.value})}
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
                            value={adminInfo.password}
                            onChange={(e) => setAdminInfo({...adminInfo, password: e.target.value})}
                            placeholder="Enter password"
                            required
                            className="block w-full"
                        />
                        <div onClick={handlePass} className="absolute top-1/2 -translate-y-1/2 right-2">
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </div>
                        
                    </div>

                    <label className="block" htmlFor="confirmPass">Confirm Password</label>
                    <div className="relative">
                        <input 
                            type={showConfirmPassword ? "text" : "password"}
                            id='confirmPass'
                            value={adminInfo.confirmPassword}
                            onChange={(e) => setAdminInfo({...adminInfo, confirmPassword: e.target.value})}
                            placeholder="Enter password"
                            required
                            className={`block w-full border ${errors.password ? 'border-red-600' : 'border-gray-300'}`}
                        />
                        <div onClick={handleConfirmPass} className="absolute top-1/2 -translate-y-1/2 right-2">
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </div>
                    </div>
                    {errors.confirmPassword && <p className="text-red-600 text-[13px] italic">{errors.confirmPassword}</p>}

                    <label className="block" htmlFor="companyName">Company Name</label>
                    <input 
                        type="text"
                        id="companyName"
                        value={adminInfo.companyName}
                        onChange={(e) => setAdminInfo({...adminInfo, companyName: e.target.value})}
                        placeholder="Enter company name"
                        required
                        className={`block w-full border ${errors.company ? 'border-red-600' : 'border-gray-300'}`}
                    />
                    {errors.company && <p className="text-red-600 text-[13px] italic">{errors.company}</p>}

                    <label className="block" htmlFor="companyLocation">Company Location</label>
                    <div className="relative">
                        <input
                            type="text"
                            id="companyLocation"
                            value={adminInfo.companyLocation}
                            onChange={(e) =>
                                setAdminInfo({...adminInfo,companyLocation: e.target.value})
                            }
                            placeholder="Enter company location"
                            required
                            autoComplete="off"
                            className="block w-full overflow-x-scroll"
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

                    <PrimaryButton type="submit" className="w-full">Register</PrimaryButton>
                    {errors.general && <div className="bg-red-100 text-red-600 p-3 mb-4 rounded">{errors.general}</div>}
                </form>
            </div>
            <Footer />
        </>
    )
}