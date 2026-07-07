import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer"
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import defaultCover from "../../assets/defaultCover.jpg"
import { IoChevronDown } from "react-icons/io5";
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import { resumeStore } from "../../zustand/skillGapResume";
import axios from "axios";


export default function JobAppInitialStep() {
    const navigate = useNavigate();
    const { currentUser } = userStore();
    const {
        resumeToAnalyze,
        setResumeToAnalyze,
        selectedYears,
        setSelectedYears
    } = resumeStore();

    const { jobID } = useParams();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);

    const [allResumes, setAllResumes] = useState([]);
    const [isResumeDropdownOpen, setIsResumeDropdownOpen] = useState(false);
    const [selectedResumeID, setSelectedResumeID] = useState("");
    const selectedResume = allResumes?.find(
        (resume) => String(resume.resumeID) === String(selectedResumeID)
    );

    const [currentJob, setCurrentJob] = useState({});

    const [errors, setErrors] = useState({});

    const experienceOptions = [
        { label: "No experience", value: "0" },
        { label: "Less than a year", value: "0.5" },
        { label: "1 year", value: "1" },
        { label: "2 years", value: "2" },
        { label: "3 years", value: "3" },
        { label: "4 years", value: "4" },
        { label: "5 years", value: "5" },
        { label: "More than 5 years", value: "6" },
    ];

    useEffect(() => {
        async function checkApplicant() {
            try {
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    return;
                }

                await axios.get("/api/applicant/authorize", {
                    params: {
                        applicantID: currentUser.applicantID
                    }
                });

                setVerified(true);
            } catch (error) {
                console.log(error);
                setVerified(false);
            } finally {
                
                setLoading(false);
            }
        }

        checkApplicant();
    }, [currentUser]);

    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden");
        }
    }, [loading, verified, navigate]);

    useEffect(() => {
        async function getAllResumes() {
            try {
                const allResumes = await axios.get("/api/applicant/getAllResumes", {
                    withCredentials: true
                })

                setAllResumes(allResumes.data?.allResumes);
            } catch (error) {
                console.log(error)
            }
        }

        getAllResumes();
    }, []);

    useEffect(() => {
        async function getJobInfo() {
            try {
                const result = await axios.get(`/api/applicant/viewJob/${jobID}`, {
                    withCredentials: true
                });
    
                setCurrentJob(result.data);
                
            } catch (error) {
                console.log(error);
            }
        }

        getJobInfo();
    }, []);


    function goNextPage() {
        if (!selectedResume) {
            setErrors({noResume: "Please select a resume"})
            return
        }

        if (!selectedYears) {
            setErrors({noYears: "Please select your years of relevant experience."})
            return
        }
        
        setErrors({})
        setResumeToAnalyze(selectedResume)
        navigate(`/applicant/viewJob/${jobID}/apply/submit`);
    }


    if (loading) {
        return <Loading />
    }

    if (!verified) {
        return null;
    }


    return (
        <>
            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />
                <Overlay />
                
                <div className="w-full min-h-[calc(100vh-64px)] p-6 flex flex-col justify-center items-center gap-5 md:p-15">
                    <div className="w-full flex gap-3 md:gap-5 md:max-w-120">
                        <div className="w-30 rounded-lg">
                            <img className="w-full object-cover rounded-lg" src={currentJob.profilePhotoURL ? currentJob.profilePhotoURL : defaultCover} alt="" />
                        </div>

                        <div className="flex-1">
                            <p className="text-sm text-gray-500">Applying for</p>
                            <h1 className="text-xl font-bold text-gray-900">{currentJob.jobTitle}</h1>
                            <p className="text-gray-700 font-semibold">{currentJob.companyName}</p>
                            <Link to={`/applicant/viewJob/${jobID}`} className="underline underline-offset-4 text-sm text-blue-600 font-medium">View job description</Link>
                        </div>
                    </div>

                    <div className="bg-white shadow-lg rounded-2xl p-6 w-full md:w-120">
                        <h2 className="font-bold text-lg mb-3">Choose Resume</h2>
                        <p className="text-[13px] mb-5 text-gray-600">
                            <a
                                href="/2025-template_bullet.docx"
                                download="2025-template_bullet.docx"
                                rel="noopener noreferrer"
                                className="text-blue-600"
                            >
                                Download
                            </a>{" "}
                            our recommended resume template, or use a similar layout for more accurate skill matching
                        </p>

                        <div className="flex flex-col gap-4 mb-5">
                            <div className="flex flex-col gap-2 w-full">
                                <div className="w-full relative min-w-0 mb-7">
                                    <button
                                        type="button"
                                        onClick={() => setIsResumeDropdownOpen(!isResumeDropdownOpen)}
                                        className={`w-full border rounded-lg p-2 pr-9 text-left truncate text-black cursor-pointer ${errors.noResume ? "border-2 border-red-600" : "border-gray-300"}`}
                                    >
                                        {selectedResume ? selectedResume.origFileName : "Please select a resume"}
                                    </button>

                                    <IoChevronDown className="absolute right-4 top-5 -translate-y-1/2 pointer-events-none" />

                                    {isResumeDropdownOpen && (
                                        <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-300 bg-white shadow-md">
                                            <button
                                                type="button"
                                                disabled
                                                className="w-full px-3 py-2 text-left text-gray-500 truncate"
                                            >
                                                Please select a resume
                                            </button>

                                            {allResumes?.map((resume) => (
                                                <button
                                                    key={resume.resumeID}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedResumeID(resume.resumeID);
                                                        setIsResumeDropdownOpen(false);
                                                    }}
                                                    className="w-full px-3 py-2 text-left truncate hover:bg-cyan-100"
                                                    title={resume.origFileName}
                                                >
                                                    {resume.origFileName}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* <div className="flex flex-col gap-2 mb-10">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="resumeOption"
                                        value="upload"
                                        checked={selectedOption === "upload"}
                                        onChange={() => setSelectedOption("upload")}
                                        className="w-4 h-4"
                                    />
                                    <span className={selectedOption === "upload" ? "text-black" : "text-gray-400"}>
                                        Upload resume <span className="text-sm">(pdf or docx)</span>
                                    </span>
                                </label>

                                <div>
                                    {uploadedResumeName && (
                                        <p className={`truncate mb-2 ml-6 text-sm font-medium ${selectedOption === "upload" ? "text-gray-700" : "text-gray-400"}`}>
                                            {uploadedResumeName}
                                        </p>
                                    )}

                                    <label className={`ml-6 flex items-center gap-1 border rounded-lg px-2.5 py-2 w-fit ${
                                        selectedOption === "upload"
                                            ? "text-black border-gray-300 cursor-pointer hover:bg-gray-100"
                                            : "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                                    }`}>
                                        <FiUpload className="h-6 mr-3" />
                                        {uploadedResumeName ? "Change Resume" : "  Upload"}
                                        <input 
                                            type="file"
                                            id="resume"
                                            disabled = {selectedOption !== "upload"}
                                            accept=".docx, .pdf"
                                            onChange={(e) => {
                                                const file = e.target.files[0]
            
                                                if (!file) return;
            
                                                setUploadedResume(file)
                                                setUploadedResumeName(file.name)
                                            }}
                                            className="hidden"
                                        />
                                    </label>
            
                                </div>
                            </div> */}
                        </div>
                        
                        <h1 className="text-lg font-bold mb-3">Relevant Experience</h1>
                        <p className="mb-3">How many years of relevant experience do you have for this job role?</p>
                        <div className="flex flex-col gap-4 mb-7">
                            {experienceOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center gap-4 text-md cursor-pointer"
                                >
                                <input
                                    type="radio"
                                    name="yearsRequired"
                                    value={option.value}
                                    checked={selectedYears === option.value}
                                    onChange={(e) => setSelectedYears(e.target.value)}
                                />

                                <span>{option.label}</span>
                                </label>
                            ))}
                        </div>

                        {errors.noResume && <p className="text-center text-sm text-red-600 mb-5">{errors.noResume}</p>}
                        {errors.noYears && <p className="text-center text-sm text-red-600 mb-5">{errors.noYears}</p>}

                        <div className="w-full flex justify-between">
                            <PrimaryButton to={`/applicant/viewJob/${jobID}`} className="bg-gray-200 text-black! border-2 border-gray-400">Cancel</PrimaryButton>
                            <PrimaryButton onClick={goNextPage}  className={`px-5`}>
                                Next                                
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    )
}