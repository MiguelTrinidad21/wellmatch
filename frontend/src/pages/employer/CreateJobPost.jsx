import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Loading from "../../components/others/Loading";
import { IoChevronDown } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { jobCreationStore } from "../../zustand/stateHandlers";
import { userStore } from "../../zustand/userState";
import axios from "axios";

export default function CreateJobPost({ mode = "create" }) {
    const { jobID } = useParams();
    const isEditMode = mode === "edit";

    const { createdJob, setCreatedJob, clearCreatedJob } = jobCreationStore();
    const { currentUser } = userStore();
    const navigate = useNavigate();

    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [isLocationSelected, setIsLocationSelected] = useState(false);
    const [lastSelectedLocation, setLastSelectedLocation] = useState(createdJob.location);
    const [shouldSearchLocation, setShouldSearchLocation] = useState(false);
    
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [salaryError, setSalaryError] = useState("")


    useEffect(() => {
        async function checkEmployer() {
            try {
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    setLoading(false);
                    return;
                }

                await axios.get("/api/employer/authorize", {
                    params: {
                        employerID: currentUser.employerID
                    }
                });

                setVerified(true);
            } catch (error) {
                console.log(error);
                setVerified(false);
                navigate("/forbidden");
            } finally {
                setLoading(false);
            }
        }

        checkEmployer();
    }, [currentUser]);

    useEffect(() => {
        if (!shouldSearchLocation) return;

        const searchText = createdJob.location.trim();

        if (searchText.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        const delay = setTimeout(async () => {
            try {
                setIsSearchingLocation(true);

                const response = await axios.get("/api/geoapify/autocomplete", {
                    params: {
                        text: searchText
                    }
                });

                setLocationSuggestions(response.data.suggestions);
            } catch (error) {
                console.error(error.response?.data || error.message);
                setLocationSuggestions([]);
            } finally {
                setIsSearchingLocation(false);
            }
        }, 500);

        return () => clearTimeout(delay);
    }, [createdJob.location, shouldSearchLocation]);

    useEffect(() => {
        async function fetchJobForEdit() {
            if (!isEditMode) return;

            try {
                const response = await axios.get(`/api/employer/jobs/${jobID}`, {
                    withCredentials: true
                });

                const job = response.data.jobToEdit;
                setShouldSearchLocation(false);

                setCreatedJob({
                    jobTitle: job.jobTitle,
                    location: job.location,
                    workplaceOption: job.workPlaceOption,
                    workType: job.workType,
                    payRangeFrom: job.minSalary,
                    payRangeTo: job.maxSalary,
                    jobOverview: job.jobOverview,
                    jobDuties: job.jobDuties,
                    requiredQualifications: job.requiredQualifications,
                    preferredQualifications: job.preferredQualifications || "",
                    workingConditions: job.workingConditions || "",
                    jobBenefits: job.jobBenefits || "",
                    yearsRequired: String(job.requiredYearsExp)
                });
            } catch (error) {
                console.error(error);
                navigate("/forbidden");
            }
        }

        fetchJobForEdit();
    }, [isEditMode, jobID]);

    function handleNext(e) {
        e.preventDefault();

        if (createdJob.payRangeFrom > createdJob.payRangeTo) {
            setSalaryError("Expected maximum salary must be higher than minimum salary");
            return;
        }

        setSalaryError("");

        if (isEditMode) {
            navigate(`/employer/jobs/${jobID}/edit/description`);
        } else {
            navigate("/employer/createJob/description");
        }
    }

    function cancelJobCreation() {
        clearCreatedJob();
        navigate("/employer/jobs");
    }

    function handleSelectLocation(place) {
        const formatted = [
            place.city,
            place.state
        ].filter(Boolean).join(", ");

        setShouldSearchLocation(false);

        setCreatedJob({location: formatted});

        setLastSelectedLocation(formatted);

        setLocationSuggestions([]);
    }

    if (loading) {
        return <Loading />
    }

    return (
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6]">
                <AuthNavBar />
                <Overlay />

                <div className="w-full p-6 md:p-15">
                    <h1 className="text-2xl font-bold mb-6 text-center">{
                        isEditMode ? "Update Job Post" : "Create Job Post"}
                    </h1>
                    
                    <form onSubmit={handleNext} className="w-full rounded-2xl bg-white p-6 shadow-md m-auto md:w-100">
                        <div className="w-full mb-6">
                            <label className="block font-semibold text-lg mb-2" htmlFor="jobTitle">Job Title</label>
                            <input 
                                className="w-full text-md p-2 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-sm"
                                type="text"
                                id="jobTitle"
                                placeholder="Enter job title"
                                value={createdJob.jobTitle}
                                onChange={(e) => setCreatedJob({jobTitle: e.target.value})}
                                required                             
                            />
                        </div>
                        <div className="w-full mb-6">
                            <label className="block font-semibold text-lg mb-2" htmlFor="location">Location</label>
                            <div className="relative">
                                <input 
                                    className="w-full text-md p-2 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-sm"
                                    type="text"
                                    id="location"
                                    placeholder="Enter city or municipality"
                                    value={createdJob.location}
                                    onChange={(e) => {
                                        setShouldSearchLocation(true);
                                        setCreatedJob({location: e.target.value});
                                    }}
                                    required                             
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
                        </div>

                        <div className="w-full mb-6">
                            <label className="block font-semibold text-lg mb-2" htmlFor="workplaceOption">Workplace Option</label>

                            <div className="w-full relative">
                                <select 
                                    className={`w-full text-md p-2 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-sm appearance-none ${createdJob.workplaceOption === "" ? "text-gray-400" : "text-black"}`}
                                    id="workplaceOption"
                                    value={createdJob.workplaceOption}
                                    onChange={(e) => setCreatedJob({workplaceOption: e.target.value})}
                                    required                             
                                >
                                    <option value="" disabled>Select workplace settings</option>
                                    <option value="On-site">On-site</option>
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                                <IoChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="w-full mb-6">
                            <label className="block font-semibold text-lg mb-2" htmlFor="workType">Work Type</label>

                            <div className="w-full relative">
                                <select 
                                    className={`w-full text-md p-2 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-sm appearance-none ${createdJob.workType === "" ? "text-gray-400" : "text-black"}`}
                                    id="workType"
                                    value={createdJob.workType}
                                    onChange={(e) => setCreatedJob({workType: e.target.value})}
                                    required                             
                                >
                                    <option value="" disabled>Select work type</option>
                                    <option value="Full-time">Full-time</option>
                                    <option value="Contract">Contract</option>
                                </select>
                                <IoChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <h2 className="text-lg font-semibold mb-2">Pay Range</h2>
                        <div className="w-full mb-3 grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-md mb-2" htmlFor="from">From</label>
                                <input 
                                    className="w-full text-md p-2 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-sm"
                                    type="number"
                                    id="from"
                                    value={createdJob.payRangeFrom}
                                    onChange={(e) => setCreatedJob({payRangeFrom: e.target.value})}
                                    required                             
                                />
                            </div>
                            <div>
                                <label className="block text-md mb-2" htmlFor="from">To</label>
                                <input 
                                    className="w-full text-md p-2 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-sm"
                                    type="number"
                                    id="to"
                                    value={createdJob.payRangeTo}
                                    onChange={(e) => setCreatedJob({payRangeTo: e.target.value})}
                                    required                            
                                />                       
                            </div>
                        </div>
                        {salaryError && <p className="text-[13px] text-red-600 mb-3">{salaryError}</p>}

                        <div className="flex justify-between w-full mt-8">
                            <PrimaryButton onClick={cancelJobCreation} className="bg-white text-black! border-2 border-gray-400">Cancel</PrimaryButton>
                            <PrimaryButton type="submit" className="px-8">Next</PrimaryButton>
                        </div>
                    </form>
                </div>

            </div>

            <Footer />
        </>
    )
}