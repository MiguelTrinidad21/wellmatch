import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import ApplicantSideBar from "../../components/navBars/ApplicantSideBar";
import Loading from "../../components/others/Loading"
import PrimaryButton from "../../components/buttons/PrimaryButton";
import WorkHistoryForm from "../../components/popUps/WorkHistoryForm";
import CredentialsForm from "../../components/popUps/CredentialsForm";
import ApplicantInfoForm from "../../components/popUps/ApplicantInfoForm";
import EducationForm from "../../components/popUps/EducationForm";
import AddResumeForm from "../../components/popUps/AddResumeForm"
import Translucent from "../../components/overlay/Translucent";
import DeleteItemBox from "../../components/popUps/DeleteItemBox"

import defaultProfile from "../../assets/defaultProfile.jpg"
import { MdOutlineEmail } from "react-icons/md";
import { SlLocationPin } from "react-icons/sl";
import { FaCheck } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { FiDownload } from "react-icons/fi";
import { IoMdAdd } from "react-icons/io";
import { FaTrashCan } from "react-icons/fa6";
import { FaEllipsisVertical } from "react-icons/fa6";
import { userStore } from "../../zustand/userState";
import { sideBarStore } from "../../zustand/stateHandlers";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";


export default function MyProfile() {
    const navigate = useNavigate();
    const { currentUser, handleCurrentUser } = userStore();
    const { setApplicantActiveLink } = sideBarStore();

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [workExp, setWorkExp] = useState([]);
    const [refreshWorkExp, setRefreshWorkExp] = useState(false);
    const [credentials, setCredentials] = useState([]);
    const [refreshCredentials, setRefreshCredentials] = useState(false);
    const [education, setEducation] = useState([]);
    const [refreshEducation, setRefreshEducation] = useState(false);
    const [resumes, setResumes] = useState([]);
    const [refreshResumes, setRefreshResumes] = useState(false);

    const [refreshUser, setRefreshUser] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    const [openWorkForm, setOpenWorkForm] = useState(false);
    const [openCredentialForm, setOpenCredentialForm] = useState(false);
    const [openEducationForm, setOpenEducationForm] = useState(false);
    const [openEditForm, setOpenEditForm] = useState(false);
    const [openResumeForm, setOpenResumeForm] = useState(false);
    const [showResumeMenu, setShowResumeMenu] = useState(false);
    const [resumeMenuID, setResumeMenuID] = useState(null);

    const [deleteCredential, setDeleteCredential] = useState(false);
    const [deleteWorkExp, setDeleteWorkExp] = useState(false);
    const [deleteEduc, setDeleteEduc] = useState(false);
    const [deleteResume, setDeleteResume] = useState(false);

    const [workExpID, setWorkExpID] = useState(null);
    const [credID, setCredID] = useState(null);
    const [educID, setEducID] = useState(null);
    const [resumeID, setResumeID] = useState(null);

    const dateOptions = {month: "short", day: "numeric", year: "numeric"};

    function toggleForm(stateFunction) {
        stateFunction(prev => !prev);
    }

    function refreshData(stateFunction) {
        stateFunction(prev => ! prev);
    }

    function toggleWarning(stateFunction) {
        stateFunction(prev => ! prev);
    }

    async function handleWorkExpDeletion(workExpID) {
        try {
            console.log(workExpID)
            await axios.delete("/api/applicant/delete/workExp", {
                params: { workExpID },
                withCredentials: true
            });

            refreshData(setRefreshWorkExp);
            toggleWarning(setDeleteWorkExp)

        } catch (error) {
            console.log(error);
        }
    }

    async function handleCredsDeletion(credID) {
        try {
            await axios.delete("/api/applicant/delete/credential", {
                params: { credID },
                withCredentials: true
            });

            refreshData(setRefreshCredentials);
            toggleWarning(setDeleteCredential)

        } catch (error) {
            console.log(error);
        }
    }

    async function handleEducationDeletion(educID) {
        try {
            await axios.delete("/api/applicant/delete/education", {
                params: { educID },
                withCredentials: true
            });

            refreshData(setRefreshEducation);
            toggleWarning(setDeleteEduc)

        } catch (error) {
            console.log(error);
        }
    }

    async function makeResumeDefault(resumeID) {
        try {
            await axios.patch("/api/applicant/resume/makeDefault", {}, {
                params: { resumeID: resumeID },
                withCredentials: true
            })

            refreshData(setRefreshResumes);
        } catch (error) {
            console.log(error);
        }
    }

    async function handleResumeDeletion(resumeID) {
        try {
            await axios.delete("/api/applicant/delete/resume", {
                params: { resumeID },
                withCredentials: true
            })

            refreshData(setRefreshResumes);
            toggleWarning(setDeleteResume)
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        setApplicantActiveLink("My Profile")
    }, [])

    useEffect(() => {
        async function checkApplicant() {
            try {
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    return;
                }

                const result = await axios.get("/api/applicant/authorize", {
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
            navigate("/forbidden", { replace: true });
        }
    }, [loading, verified, navigate]);

    useEffect(() => {
        async function getWorkExp() {
            try {
                const allWorkExps = await axios.get("/api/applicant/getWorkExp", {
                    params: {applicantID: currentUser.id},
                    withCredentials: true
                });
                // console.log(allWorkExps.data.workExperiences)
                setWorkExp(allWorkExps.data.workExperiences);

            } catch (error) {
                console.log(error);
            }
        }

        getWorkExp();
    }, [refreshWorkExp]);

    useEffect(() => {
        async function getCredentials() {
            try {
                const allCredentials = await axios.get("/api/applicant/getCredentials", {
                    params: {applicantID: currentUser.id},
                    withCredentials: true
                });
                // console.log(allCredentials.data.credentials)
                setCredentials(allCredentials.data.credentials);

            } catch (error) {
                console.log(error);
            }
        }

        getCredentials();
    }, [refreshCredentials]);

    useEffect(() => {
        async function getResumes() {
            try {
                const result = await axios.get("/api/applicant/getAllResumes", {
                    withCredentials: true
                });
                // console.log(allCredentials.data.credentials)
                setResumes(result.data.allResumes);

            } catch (error) {
                console.log(error);
            }
        }

        getResumes();
    }, [refreshResumes]);
    

    useEffect(() => {
        async function getEducation() {
            try {
                const allEducation = await axios.get("/api/applicant/getEducation", {
                    params: {applicantID: currentUser.id},
                    withCredentials: true
                });
                // console.log(allEducation.data.education)
                setEducation(allEducation.data.education);

            } catch (error) {
                console.log(error);
            }
        }

        getEducation();
    }, [refreshEducation]);

    useEffect(() => {
        setApplicantActiveLink("My Profile")
    }, [])    

    if (loading) {
        return <Loading />
    }

    if (!verified) {
        return null;
    }

    return (
        <div className="lg:flex relative w-full">
            <ApplicantSideBar />
            <SideBarOverlay />

            <div className="w-full min-h-screen bg-[#F3F4F6] relative">
                <AuthNavBar />

                {
                    openEditForm &&
                    <ApplicantInfoForm
                        toggleForm={() => toggleForm(setOpenEditForm)}
                        
                    />
                }
                
                {
                    openWorkForm && 
                    <WorkHistoryForm 
                        toggleForm={() => toggleForm(setOpenWorkForm)} 
                        refresh={() => refreshData(setRefreshWorkExp)}
                    />
                }

                {
                    openCredentialForm && 
                    <CredentialsForm 
                        toggleForm={() => toggleForm(setOpenCredentialForm)}
                        refresh={() => refreshData(setRefreshCredentials)} 
                    />
                }

                {
                    openEducationForm && 
                    <EducationForm 
                        toggleForm={() => toggleForm(setOpenEducationForm)}
                        refresh={() => refreshData(setRefreshEducation)} 
                    />
                }

                {
                    openResumeForm &&
                    <AddResumeForm 
                        toggleForm={() => toggleForm(setOpenResumeForm)}
                        refresh={() => refreshData(setRefreshResumes)}
                    />
                }

                {
                    deleteWorkExp &&
                    <DeleteItemBox 
                        heading="Delete Work Experience"
                        toggleFunction={() => toggleWarning(setDeleteWorkExp)}
                        deleteFunction={() => handleWorkExpDeletion(workExpID)}
                    />
                }

                {
                    deleteCredential &&
                    <DeleteItemBox 
                        heading="Delete Credential"
                        toggleFunction={() => toggleWarning(setDeleteCredential)}
                        deleteFunction={() => handleCredsDeletion(credID)}
                    />
                }

                {
                    deleteEduc &&
                    <DeleteItemBox 
                        heading="Delete Education"
                        toggleFunction={() => toggleWarning(setDeleteEducation)}
                        deleteFunction={() => handleEducationDeletion(educID)}
                    />
                }

                {
                    deleteResume &&
                    <DeleteItemBox 
                        heading="Delete Resume"
                        toggleFunction={() => toggleWarning(setDeleteResume)}
                        deleteFunction={() => handleResumeDeletion(resumeID)}
                    />
                }


                <div className="w-full p-6 md:p-15 lg:p-10 xl:px-30">
                    <section className="flex gap-2 relative w-full xl:w-[80%] mb-10 md:gap-10 md:mb-15">
                        <div className="w-19 h-19 shrink-0 md:w-30 md:h-30 xl:w-40 xl:h-40">
                            <img className="w-full h-full rounded-full object-cover" src={`${currentUser.profilePhoto ? currentUser.profilePhoto : defaultProfile}`} alt="" />
                        </div>
                        <div className="pr-5 flex flex-col min-w-0 md:gap-4 md:pr-42">
                            <h1 className="text-lg font-bold wrap-break-word md:text-3xl">{`${currentUser.firstName} ${currentUser.lastName}`}</h1>
                            <div className="relative w-full text-gray-700 font-medium">
                                <MdOutlineEmail className=" absolute top-1/2 -translate-y-1/2 left-0 md:w-6 md:h-6" />
                                <p className="pl-6 wrap-break-word md:pl-10 md:text-xl">{currentUser.email}</p>
                            </div>
                            <div className="relative w-full text-gray-700 font-medium">
                                <SlLocationPin className="absolute top-1/2 -translate-y-1/2 left-0 md:w-5 md:h-5" />
                                <p className="pl-6 wrap-break-word md:pl-10 md:text-xl">{currentUser.address}</p>
                            </div>
                        </div>

                        <PrimaryButton onClick={() => toggleForm(setOpenEditForm)} className="hidden rounded-lg px-5 md:flex md:items-center md:gap-2 md:absolute md:top-0 md:right-0 ">
                            <FiEdit size={20} />
                            Edit details
                        </PrimaryButton>
                        <FiEdit size={20} onClick={() => toggleForm(setOpenEditForm)} className=" text-green-600 font-bold absolute top-0 right-0 md:hidden" />
                    </section>

                    <section className="w-full xl:w-[80%] p-5 mb-6 bg-white rounded-2xl shadow-md md:mb-10">
                        <div className="md:flex md justify-between md:items-center md:mb-5">
                            <h1 className="text-xl text-center font-bold text-green-600 mb-3 md:text-2xl md:mb-0">Work Experience</h1>
                            <PrimaryButton onClick={() => toggleForm(setOpenWorkForm)} className="hidden rounded-lg md:flex md:items-center md:gap-2">
                                <IoMdAdd size={20} />
                                Add work
                            </PrimaryButton>
                        </div>
                        <div className="w-full">
                            {   
                                workExp?.length === 0 ? <p className="text-gray-600 font-medium mb-2 text-center md:text-left">Add your previous work experience</p>
                            :
                                <div className="w-full flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-5">
                                    {workExp?.map((work) => (
                                        <div key={work.workExpID} className="relative w-full bg-[#F3F4F6] shadow-md rounded-2xl p-4">
                                            <h2 className="font-bold mb-1 text-lg">{work.jobTitle}</h2>
                                            <p className="text-gray-700 font-medium mb-3">{work.companyName}</p>
                                            <p className="text-gray-700 text-sm">{`${work.startDate} - ${work.endDate}`}</p>
                                            <button onClick={() => {
                                                setWorkExpID(work.workExpID);
                                                toggleWarning(setDeleteWorkExp);
                                            }} className="absolute bottom-5 right-4 cursor-pointer">
                                                <FaTrashCan className="text-red-600" size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>

                        <PrimaryButton className="mt-5 md:hidden w-full flex items-center gap-2 justify-center" onClick={() => toggleForm(setOpenWorkForm)}>
                            <IoMdAdd size={20} />
                            Add experience
                        </PrimaryButton>

                    </section>

                    
                    <section className="w-full xl:w-[80%] p-5 mb-6 bg-white rounded-2xl shadow-md md:mb-10">
                        <div className="md:flex md justify-between md:items-center md:mb-5">
                            <h1 className="text-xl text-center text-green-600 font-bold mb-3 md:text-2xl md:mb-0 ">Certifications and Licenses</h1>
                            <PrimaryButton onClick={() => toggleForm(setOpenCredentialForm)} className="hidden rounded-lg md:flex md:items-center md:gap-2">
                                <IoMdAdd size={20} />
                                Add credentials
                            </PrimaryButton>

                        </div>
                        <div className="w-full">
                            {   
                                credentials?.length === 0 ? <p className="text-gray-600 font-medium mb-2 text-center md:text-left">Add your certifications</p>
                            :
                                <div className="w-full flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-5">
                                    {credentials?.map((cred) => (
                                        <div key={cred.credentialID} className="relative w-full bg-[#F3F4F6] shadow-md rounded-2xl p-4">
                                            <h2 className="font-bold mb-1 text-lg">{cred.credentialTitle}</h2>
                                            <p className="text-gray-700 font-medium mb-3">{cred.issuedBy}</p>
                                            <p className="text-gray-700 text-sm">{`${cred.issueDate} - ${cred.expiryDate ? cred.expiryDate : "No expiry"}`}</p>
                                            <button onClick={() => {
                                                setCredID(cred.credentialID);
                                                toggleWarning(setDeleteCredential);
                                            }} className="absolute bottom-5 right-4 cursor-pointer">
                                                <FaTrashCan className="text-red-600" size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                        <PrimaryButton className="mt-5 md:hidden w-full flex items-center gap-2 justify-center" onClick={() => toggleForm(setOpenCredentialForm)}>
                            <IoMdAdd size={20} />
                            Add credentials
                        </PrimaryButton>                       
                        
                    </section>

                    

                    <section className="w-full xl:w-[80%] p-5 mb-6 bg-white rounded-2xl shadow-md md:mb-10">
                        <div className="md:flex md justify-between md:items-center md:mb-5">
                        <h1 className="text-xl text-center text-green-600 font-bold mb-3 md:text-2xl md:mb-0">Education</h1>
                        <PrimaryButton onClick={() => toggleForm(setOpenEducationForm)} className="hidden rounded-lg md:flex md:items-center md:gap-2">
                            <IoMdAdd size={20} />
                            Add education
                        </PrimaryButton>                        

                        </div>
                        <div className="w-full">
                            {   
                                education?.length === 0 ? <p className="text-gray-600 font-medium mb-2 text-center md:text-left">Add education</p>
                            :
                                <div className="w-full flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-5">
                                    {education?.map((item) => (
                                        <div key={item.educationID} className="relative w-full bg-[#F3F4F6] shadow-md rounded-2xl p-4">
                                            <h2 className="font-bold mb-1 text-lg">{item.courseName}</h2>
                                            <p className="text-gray-700 font-medium mb-3">{item.institution}</p>
                                            <p className="text-gray-700 text-sm">{item.graduatedAt ? `Graduated ${item.graduatedAt}` : `Expected finish ${item.willFinishAt}`}</p>
                                            <button onClick={() => {
                                                setEducID(item.educationID);
                                                toggleWarning(setDeleteEduc);
                                            }} className="absolute bottom-5 right-4 cursor-pointer">
                                                <FaTrashCan className="text-red-600" size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                        <PrimaryButton className="mt-5 md:hidden w-full flex items-center gap-2 justify-center" onClick={() => toggleForm(setOpenEducationForm)}>
                            <IoMdAdd size={20} />
                            Add education
                        </PrimaryButton>                           
                    </section>

                    

                    <section className="w-full xl:w-[80%] p-5 mb-5 bg-white rounded-2xl shadow-md">
                        <div className="md:flex md justify-between md:items-center md:mb-5">
                            <h1 className="text-xl text-center text-green-600 font-bold mb-3 md:text-2xl md:mb-0">Resumés</h1>
                            <PrimaryButton onClick={() => toggleForm(setOpenResumeForm)} className="hidden rounded-lg md:flex md:items-center md:gap-2">
                                <IoMdAdd size={20} />
                                Add resume
                            </PrimaryButton> 
                        </div>
                        <div className="w-full">
                            {   
                                resumes?.length === 0 ? <p className="text-gray-600 font-medium mb-2 text-center md:text-left">Add a new resumé</p>
                            :
                                <div className="w-full flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-5">
                                    {resumes?.map((item) => (
                                        <div 
                                            key={item.resumeID} 
                                            className={`relative w-full bg-[#F3F4F6] shadow-md rounded-2xl p-4 ${
                                                resumeMenuID === item.resumeID && showResumeMenu ? 'z-20' : 'z-0'
                                            }`}
                                        >
                                            {
                                                item.isDefault == 1 && 
                                                <div className="mb-2 px-3 rounded-sm bg-[#F0FDF4] w-fit border-2 border-[#4A9E69]">
                                                    <p className="text-[#4A9E69] font-semibold text-sm">Default</p>
                                                </div>
                                            }
                                            <h2 className="font-bold mb-1 text-lg">{item.origFileName}</h2>

                                            <div className="absolute top-1/2 -translate-y-1/2 right-4">
                                                <div className="relative">
                                                    <FaEllipsisVertical 
                                                        onClick={() => {
                                                            setResumeMenuID(item.resumeID);
                                                            setShowResumeMenu(prev => resumeMenuID === item.resumeID ? !prev : true);
                                                        }} 
                                                        size={20}
                                                        className="cursor-pointer" 
                                                    />
                                                    
                                                    {
                                                        (resumeMenuID === item.resumeID && showResumeMenu) &&
                                                        <div className="min-w-38 absolute top-full right-0 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2 z-50">
                                                            {
                                                                item.isDefault != 1 &&
                                                                <div 
                                                                    onClick={() => {
                                                                        makeResumeDefault(item.resumeID);
                                                                        setShowResumeMenu(false);
                                                                    }}
                                                                    className="text-green-600 font-semibold flex flex-row gap-3 items-center justify-start"
                                                                >
                                                                    <FaCheck />
                                                                    <p>Make default</p>
                                                                </div>
                                                            }
                                                            <div
                                                                onClick={() => {
                                                                    setResumeID(item.resumeID);
                                                                    toggleWarning(setDeleteResume);
                                                                }}
                                                                className="text-red-600 font-semibold flex flex-row gap-3 justify-start items-center "
                                                            >
                                                                <FaTrashCan />
                                                                <p>Delete</p>
                                                            </div>
                                                        </div>
                                                    }
                                                    
                                                </div>                                    
                                            </div>
                                            
                                        </div>
                                    ))}
                                </div>                                
                            }
                        </div>
                        <PrimaryButton className="mt-5 md:hidden w-full flex items-center gap-2 justify-center" onClick={() => toggleForm(setOpenResumeForm)}>
                            <IoMdAdd size={20} />
                            Add resume
                        </PrimaryButton>                        
                    </section>

                </div>
            </div>

        </div>
    )
}