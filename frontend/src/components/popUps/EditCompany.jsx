import { MdClose } from "react-icons/md";
import { MdFileUpload } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import { useState, useEffect, useRef } from "react";
import { companyStore } from "../../zustand/stateHandlers";
import PrimaryButton from "../buttons/PrimaryButton";
import axios from "axios";


export default function EditCompany({ handleEditCompanyBox }) {
    const {companyInfo, setCompanyInfo} = companyStore();

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
        <div className="w-[90%] z-40 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 bg-[#F9FAFB] rounded-2xl">
            <MdClose onClick={cancelChanges} size={30} className="absolute top-3 right-3" />

            <form className="mt-5" onSubmit={handleSubmit}>

                <div className="w-full">
                    <h1 className="font-bold text-xl">Company Details</h1>

                    <div className="mb-3">
                        <label htmlFor="companyName">Company Name</label>
                        <input 
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className={`block w-full border ${errors.company ? 'border-red-600' : 'border-gray-300'}`}
                        />
                        {errors?.companyName?.companyName || errors?.companyName?.companyName ? (
                            <p className="text-red-600 text-[13px] italic">
                                {errors?.companyName?.companyName || errors?.companyName?.companyName}
                            </p>
                        ) : null}
                    </div>



                    <label htmlFor="companyLocation">Location</label>
                    <div>
                        <input 
                            type="text"
                            id="companyLocation"
                            value={companyLocation}
                            onChange={(e) => setCompanyLocation(e.target.value)} 
                            autoComplete="off"
                            required
                            className="block w-full overflow-x-scroll"
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

                <hr className="my-5 border-t-2 border-gray-300" />

                <div className="w-full">
                    <h1 className="font-bold text-xl">Company Photos</h1>

                    <div className="w-full mb-10">
                        <p>Company Logo</p>

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

                        <label className="cursor-pointer text-[#10B981] font-semibold border-3 border-[#10B981] rounded-full py-2 px-3 inline-flex" htmlFor="logo">
                            <MdFileUpload size={20} className="h-6 mr-3" />                    
                            {profilePicName ? "Change Photo" : "  Select Photo"}
                            
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

                    <div className="w-full mb-10">
                        <p>Cover Photo</p>

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

                        <label className="cursor-pointer text-[#10B981] font-semibold border-3 border-[#10B981] rounded-full py-2 px-3 inline-flex" htmlFor="coverPhoto">
                            <MdFileUpload size={20} className="h-6 mr-3" />                    
                            {coverPicName ? "Change Photo" : "  Select Photo"}

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
            </form>

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
            
        </div>
    )
}