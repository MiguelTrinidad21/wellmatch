import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer"
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { IoChevronDown } from "react-icons/io5";
import { FiUpload } from "react-icons/fi";
import { BiLoaderAlt } from "react-icons/bi";
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import { resumeStore } from "../../zustand/skillGapResume";
import axios from "axios";



export default function SkillGapFileUploader() {
    const navigate = useNavigate();
    const { currentUser } = userStore();
    const {
        resumeToAnalyze,
        selectedOption,
        setSelectedOption,
        setResumeToAnalyze
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
    const [uploadedResume, setUploadedResume] = useState(null);
    const [uploadedResumeName, setUploadedResumeName] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const [errors, setErrors] = useState({issue: ""});

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


    async function executeSkillGapAnalysis() {
        if (!selectedResume && !uploadedResume) {
            setErrors({noResume: "Choose a resume before proceeding"})
            return
        }

        try {
            if (selectedOption === "select") {
                setResumeToAnalyze(selectedResume)
                navigate(`/applicant/viewJob/${jobID}/${selectedResume.resumeID}/skillGapReport`);
            } else {
                setIsUploading(true);
                console.log(selectedOption)

                const formData = new FormData();
                formData.append("resume", uploadedResume);

                const uploadResponse = await axios.post("/api/applicant/uploadResume", formData, {
                    withCredentials: true,
                })
                const uploadedResumeData = uploadResponse.data.resumeToAnalyze;
                setResumeToAnalyze(uploadedResumeData);
                setErrors({issue: ""})
                navigate(`/applicant/viewJob/${jobID}/${resumeToAnalyze.resumeID}/skillGapReport`);
            }
            
        } catch (error) {
            // const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (message) {
                setErrors({ issue: message }); 
            } else {
                setErrors({ issue: "Unable to connect to the server. Please try again." });
            }
        } finally {
            setIsUploading(false);
        }
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
                
                <div className="w-full min-h-[calc(100vh-64px)] p-6 flex flex-col justify-center items-center gap-5 md:px-15">
                    <div className="relative w-full flex items-center justify-center gap-3">
                        <h1 className="inline font-bold text-xl ">Skill Gap Analysis</h1>
                        <IoMdInformationCircleOutline size={20} />
                    </div>

                    <div className="bg-white shadow-md rounded-2xl p-6 w-full md:w-100">
                        <h2 className="font-semibold text-lg mb-3">Choose Resume</h2>
                        <p className="text-sm mb-3 text-gray-400">
                            Click{" "}
                            <a
                                href="/2025-template_bullet.docx"
                                download="2025-template_bullet.docx"
                                rel="noopener noreferrer"
                                className="text-blue-600"
                            >
                                here
                            </a>{" "}
                            to download our recommended resume template to ensure your skills are accurately matched.
                        </p>

                        <div className="flex flex-col gap-4 mb-5">
                            <div className="flex flex-col gap-2 w-full">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="resumeOption"
                                        value="select"
                                        checked={selectedOption === "select"}
                                        onChange={() => setSelectedOption("select")}
                                        className="w-4 h-4"
                                    />
                                    <span className={selectedOption === "select" ? "text-black" : "text-gray-400"}>
                                        Select a resume
                                    </span>
                                </label>

                                <div className="w-64 ml-6 relative min-w-0">
                                    <button
                                        type="button"
                                        disabled={selectedOption !== "select"}
                                        onClick={() => setIsResumeDropdownOpen(!isResumeDropdownOpen)}
                                        className={`w-full border rounded-lg p-2 pr-9 text-left truncate ${
                                            selectedOption === "select"
                                                ? "text-black border-gray-300 cursor-pointer"
                                                : "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                                        }`}
                                    >
                                        {selectedResume ? selectedResume.origFileName : "Please select a resume"}
                                    </button>

                                    <IoChevronDown className="absolute right-4 top-5 -translate-y-1/2 pointer-events-none" />

                                    {isResumeDropdownOpen && selectedOption === "select" && (
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

                            <div className="flex flex-col gap-2 mb-5">
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
                            </div>
                        </div>

                        {errors.issue && <p className="text-center text-sm text-red-600 mb-3">{errors.issue}</p>}

                        <div className="w-full flex justify-between">
                            <PrimaryButton to={`/applicant/viewJob/${jobID}`} className="bg-gray-200 text-black! border-2 border-gray-400">Cancel</PrimaryButton>
                            <PrimaryButton disabled={isUploading} onClick={executeSkillGapAnalysis} className={`px-4 ${isUploading && "opacity-50"}`}>
                                {isUploading ? 
                                    <span className="flex gap-2 items-center justify-center">
                                        <BiLoaderAlt className="animate-spin" size={20} />
                                        Analyzing
                                    </span>
                                : "Analyze"
                                }
                                
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    )
}