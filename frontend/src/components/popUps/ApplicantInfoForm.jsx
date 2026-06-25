import { IoClose } from "react-icons/io5";
import { MdFileUpload } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import PrimaryButton from "../buttons/PrimaryButton";
import { useEffect, useState, useRef } from "react";
import Translucent from "../overlay/Translucent";
import axios from "axios";
import { userStore } from "../../zustand/userState";


export default function ApplicantInfoForm({ toggleForm }) {
    const {currentUser, handleCurrentUser} = userStore();

    const [firstName, setFirstName] = useState(currentUser.firstName);
    const [lastName, setLastName] = useState(currentUser.lastName);
    const [email, setEmail] = useState(currentUser.email);
    const [prevEmail, setPrevEmail] = useState(currentUser.email);
    const [address, setAddress] = useState(currentUser.address);
    const [profilePicName, setProfilePicName] = useState("");
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [errors, setErrors] = useState({});

    const [isLoading, setIsLoading] = useState(false);

    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [isLocationSelected, setIsLocationSelected] = useState(false);
    const [lastSelectedLocation, setLastSelectedLocation] = useState(currentUser.address);
    
    const prevLocationRef = useRef(address);

    useEffect(() => {
        const searchText = address.trim();

        if (prevLocationRef.current === address) {
            return;
        }

        prevLocationRef.current = address;
        
        if (isLocationSelected && (lastSelectedLocation === address)) {
            return;
        }

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
    }, [address]);

    function handleSelectLocation(place) {
        const formatted = [
            place.city,
            place.state
        ].filter(Boolean).join(", ");

        setAddress(formatted);

        setLastSelectedLocation(formatted);

        setLocationSuggestions([]);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setIsLoading(true);

        const formData = new FormData();

        formData.append("firstName", firstName)
        formData.append("lastName", lastName);
        formData.append("email", email);
        formData.append("prevEmail", prevEmail);
        formData.append("address", address);

        if (profilePhoto) {
            formData.append("profilePhoto", profilePhoto);
        }

        try {
            const result = await axios.patch(
                "/api/applicant/editProfileInfo",
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            handleCurrentUser(result.data.user);
            
            setIsLoading(false);
            setErrors({})
            toggleForm();
            
        } catch (error) {
            setIsLoading(false)

            const backendMessage = error.response?.data?.message;
            const backendIssue = error.response?.data?.issue;
            const backendField = error.response?.data?.field;

            if (backendIssue && backendMessage) {
                setErrors({
                        [backendIssue]: backendMessage
                    }
                );
            } else if (backendMessage) {
                setErrors({ general: backendMessage });
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            }
        }
    }

    return (
        <>
            <Translucent />
        
            <div className="w-[85%] p-5 bg-[#F3F4F6] fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 rounded-2xl">
                <IoClose onClick={toggleForm} size={20} className="absolute top-2 right-2" />

                <h1 className="font-bold text-xl mb-3 text-center">Update Information</h1>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex flex-col w-full mb-4">
                        <label className="font-semibold" htmlFor="firstName">First Name</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}                       
                        />
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <label className="font-semibold" htmlFor="lastName">Last Name</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}                       
                        />
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <label className="font-semibold" htmlFor="email">Email Address</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}                       
                        />
                        {errors.email && <p className="text-[11px] text-red-600">Email address is already taken</p>}
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <label className="font-semibold" htmlFor="address">Location</label>
                        <div>
                            <input 
                                type="text"
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)} 
                                autoComplete="off"
                                required
                                className="block w-full overflow-x-scroll p-2 border border-gray-400 rounded-md mt-1"
                            />

                            {isSearchingLocation && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Searching locations...
                                </p>
                            )}

                            {locationSuggestions.length > 0 && (
                                <ul className="absolute left-0 z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                                    {locationSuggestions.map((place) => (
                                        <li
                                            key={place.placeId}
                                            onClick={() => {
                                                setIsLocationSelected(true)
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
                    </div>

                    <div className="w-full mb-5">
                        <p className="font-semibold">Profile Photo</p>

                        {profilePicName ? (
                            <p className="mb-2 text-sm font-medium text-gray-700">
                                {profilePicName}
                            </p>
                        ) : <p className="mb-2 text-[13px] font-medium text-gray-500">Upload your profile picture (5MB max)</p>}

                        {errors?.fileSize || errors?.fileType || errors.uploadError ? (
                            <p className="text-red-600 text-[12px] mb-2">
                                {errors?.fileSize || errors?.fileType || errors.uploadError}
                            </p>
                        ) : null}

                        <label className="cursor-pointer text-[#10B981] font-semibold border-3 border-[#10B981] rounded-full py-2 px-3 inline-flex" htmlFor="profile">
                            <MdFileUpload size={20} className="h-6 mr-3" />                    
                            {profilePicName ? "Change Photo" : "  Select Photo"}
                            
                            <input 
                                type="file" 
                                id="profile"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                onChange={(e) => {
                                    const file = e.target.files[0]

                                    if (!file) return;

                                    setProfilePhoto(file)
                                    setProfilePicName(file.name)
                                }}
                                className="hidden"
                            />
                        </label>
                    </div>                    



                    {/* {errors && <p>{errors}</p>} */}

                    <div className="w-full flex justify-end gap-4">
                        <PrimaryButton disabled={isLoading} className={`bg-gray-200 text-black! px-4 border-2 border-gray-500 ${isLoading && "opacity-50"}`} onClick={toggleForm}>Cancel</PrimaryButton>
                        <PrimaryButton disabled={isLoading} type="submit" className={`px-7 ${isLoading && "opacity-50"}`}>
                            {isLoading ? 
                                <>
                                    <BiLoaderAlt className="animate-spin inline mr-3" />
                                    Saving...
                                </>
                            : "Save"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </>
    )
}