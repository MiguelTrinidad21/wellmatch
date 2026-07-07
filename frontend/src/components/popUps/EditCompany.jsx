import { MdClose } from "react-icons/md";
import { MdFileUpload } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import { useState, useEffect, useRef } from "react";
import { companyStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";
import PrimaryButton from "../buttons/PrimaryButton";
import axios from "axios";


export default function EditCompany({ handleEditCompanyBox }) {
    const {companyInfo, setCompanyInfo} = companyStore();
    const { currentUser, handleCurrentUser } = userStore();

    const [isLoading, setIsLoading] = useState(false);
    const [coverPicName, setCoverPicName] = useState("");
    const [profilePicName, setProfilePicName] = useState("");
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [prevCompanyName, setPrevCompanyName] = useState(companyInfo.companyName)
    const [companyName, setCompanyName] = useState(companyInfo.companyName);
    const [companyLocation, setCompanyLocation] = useState(companyInfo.location);
    const [errors, setErrors] = useState({});

    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [isLocationSelected, setIsLocationSelected] = useState(false);
    const [lastSelectedLocation, setLastSelectedLocation] = useState(companyInfo.location);

    const prevLocationRef = useRef(companyLocation);        

    useEffect(() => {
        const searchText = companyLocation.trim();

        if (prevLocationRef.current === companyLocation) {
            return;
        }

        prevLocationRef.current = companyLocation;
        
        if (isLocationSelected && (lastSelectedLocation === companyLocation)) {
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
    }, [companyLocation, isLocationSelected]);

    function cancelChanges() {
        handleEditCompanyBox();
    }

    function handleProfilePicName(e) {
        const file = e.target.files[0];

        if (errors?.profilePic) {
            
        }
    }

    function handleSelectLocation(place) {
        const formatted = [
            place.city,
            place.state
        ].filter(Boolean).join(", ");

        setCompanyLocation(formatted);

        setLastSelectedLocation(formatted);

        setLocationSuggestions([]);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setIsLoading(true);

        const formData = new FormData();

        formData.append("prevCompanyName", prevCompanyName)
        formData.append("companyName", companyName);
        formData.append("companyLocation", companyLocation);

        if (profilePhoto) {
            formData.append("profilePhoto", profilePhoto);
        }

        if (coverPhoto) {
            formData.append("coverPhoto", coverPhoto);
        }

        try {
            const result = await axios.patch(
                "/api/employer/editCompany",
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            const cleanFields = result.data.cleanFields;
            setCompanyInfo({...companyInfo, ...cleanFields});
            handleCurrentUser({
                ...currentUser, 
                companyPhoto: cleanFields.profilePhotoURL,
                companyName: cleanFields.companyName
            })
            
            setIsLoading(false);
            handleEditCompanyBox();
        } catch (error) {
            setIsLoading(false)

            const backendMessage = error.response?.data?.message;
            const backendIssue = error.response?.data?.issue;
            const backendField = error.response?.data?.field;

            if (backendIssue && backendMessage) {
                setErrors({ 
                    [backendField]: {
                        [backendIssue]: backendMessage
                    }
                });
            } else if (backendMessage) {
                setErrors({ general: backendMessage });
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            }
        }
    }

    return (
        <div className="w-[90%] max-h-[98%] overflow-y-auto z-40 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 bg-[#F9FAFB] rounded-2xl md:w-100">
            <div className="relative">
            <MdClose onClick={cancelChanges} size={30} className="fixed top-3 right-3" />

            </div>

            <form className="mt-5" onSubmit={handleSubmit}>

                <div className="w-full">
                    <h1 className="font-bold text-xl mb-2">Company Details</h1>

                    <div className="mb-3">
                        <label className="font-semibold block mb-1" htmlFor="companyName">Company Name</label>
                        <input 
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className={`text-sm p-2 rounded-md block w-full border-2 mb-4 bg-slate-100 outline-none transition-colors duration-200 ease-in-out focus:border-gray-600 ${errors?.companyName?.companyName ? 'border-red-600 focus:border-red-600 mb-1!' : 'border-gray-300'}`}
                        />
                        {errors?.companyName?.companyName || errors?.companyName?.companyName ? (
                            <p className="text-red-600 text-[13px] mb-4">
                                * {errors?.companyName?.companyName || errors?.companyName?.companyName}
                            </p>
                        ) : null}
                    </div>



                    <label className="font-semibold block mb-1" htmlFor="companyLocation">Location</label>
                    <div className="relative">
                        <input 
                            type="text"
                            id="companyLocation"
                            value={companyLocation}
                            onChange={(e) => setCompanyLocation(e.target.value)} 
                            autoComplete="off"
                            required
                            className="block w-full overflow-x-scroll text-sm p-2 rounded-md border-2 border-gray-300 mb-4 bg-slate-100 outline-none transition-colors duration-200 ease-in-out focus:border-gray-600"
                        />

                        {isSearchingLocation && (
                            <p className="mt-1 text-xs text-gray-500">
                                Searching locations...
                            </p>
                        )}

                        {locationSuggestions.length > 0 && (
                            <ul className="absolute left-0 z-30 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
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

                <hr className="mt-5 mb-4 border-t-2 border-gray-300" />

                <div className="w-full">
                    <h1 className="font-bold text-xl mb-2">Company Photos</h1>

                    <div className="w-full mb-5">
                        <p className="font-semibold">Company Logo</p>

                        {profilePicName ? (
                            <p className="mb-2 text-sm font-medium text-gray-700">
                                {profilePicName}
                            </p>
                        ) : <p className="mb-2 text-[13px] font-medium text-gray-500">Upload your company logo (5MB max)</p>}

                        {errors?.profilePhoto?.fileSize || errors?.profilePhoto?.fileType ? (
                            <p className="text-red-600 text-[13px] italic">
                                {errors?.profilePhoto?.fileSize || errors?.profilePhoto?.fileType}
                            </p>
                        ) : null}

                        <label className="cursor-pointer bg-green-300 text-black font-semibold rounded-md py-1 px-2 inline-flex md:py-2" htmlFor="logo">
                            <MdFileUpload size={20} className="h-6 mr-3" />                    
                            {profilePicName ? "Change Profile" : "  Select Profile"}
                            
                            <input 
                                type="file" 
                                id="logo"
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

                    <div className="w-full mb-5">
                        <p className="font-semibold">Cover Photo</p>

                        {coverPicName ? (
                            <p className="mb-2 text-sm font-medium text-gray-700">{coverPicName}</p>
                        ) : 
                            <p className="mb-2 text-[13px] font-medium text-gray-500">Upload company cover photo (5MB max)</p>
                        }

                        {errors?.coverPhoto?.fileSize || errors?.coverPhoto?.fileType ? (
                            <p className="text-red-600 text-[13px] italic">
                                {errors?.coverPhoto?.fileSize || errors?.coverPhoto?.fileType}
                            </p>
                        ) : null}

                        <label className="cursor-pointer bg-green-300 text-black font-semibold rounded-md py-1 px-2 inline-flex md:py-2" htmlFor="coverPhoto">
                            <MdFileUpload size={20} className="h-6 mr-3" />                    
                            {coverPicName ? "Change Cover" : "  Select Cover"}

                            <input 
                                type="file" 
                                id="coverPhoto"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                onChange={(e) => {
                                    const file = e.target.files[0]

                                    if (!file) return;

                                    setCoverPhoto(file)
                                    setCoverPicName(file.name)
                                }}
                                className="hidden"
                            />


                        </label>
                    </div>


                </div>
                <div className="w-full flex justify-end gap-4">
                    <PrimaryButton disabled={isLoading} className={`bg-gray-200 text-black! px-4 border-2 border-gray-500 ${isLoading && "opacity-50"}`} onClick={cancelChanges}>Cancel</PrimaryButton>
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
    )
}