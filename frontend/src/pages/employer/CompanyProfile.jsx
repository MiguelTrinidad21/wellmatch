import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import AuthNavBar from "../../components/navBars/AuthNavBar";
import SideBarOverlay from "../../components/overlay/SideBarOverlay";
import EmployerSideBar from "../../components/navBars/EmployerSideBar";
import Translucent from "../../components/overlay/Translucent";
import EditCompany from "../../components/popUps/EditCompany";
import Loading from "../../components/others/Loading";
import WarningBox from "../../components/popUps/DeleteItemBox";
import ConfirmationBox from "../../components/popUps/ConfirmationBox"
import InviteEmployer from "../admin/InviteEmployer";
import defaultCover from "../../assets/defaultCover.jpg"
import { IoMdAdd } from "react-icons/io";
import { IoPersonRemove } from "react-icons/io5";
import { MdClose } from "react-icons/md";
import { LuEllipsisVertical } from "react-icons/lu";
import { FiEdit } from "react-icons/fi";
import { SlLocationPin } from "react-icons/sl";
import { useState, useEffect } from "react";
import { userStore } from "../../zustand/userState";
import { companyStore, sideBarStore } from "../../zustand/stateHandlers";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function CompanyProfile() {

    const { currentUser } = userStore();
    const { companyInfo, setCompanyInfo } = companyStore();
    const { setEmployerActiveLink } = sideBarStore();
    const navigate = useNavigate();

    const [companyMembers, setCompanyMembers] = useState([]);
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editCompany, setEditCompany] = useState(false);

    const [showDelete, setShowDelete] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isRemoved, setIsRemoved] = useState(false);
    const [memberID, setMemberID] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [errors, setErrors] = useState("");

    const [showInvite, setShowInvite] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);

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
            } finally {
                setLoading(false);
            }
        }

        checkEmployer();
    }, [currentUser]);

    useEffect(() => {
        setEmployerActiveLink("Company Profile");
    }, [])

    useEffect(() => {
        function handleClickOutside(event) {
            if (!event.target.closest("[data-member-menu]")) {
                setShowMenu(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {

        async function fetchCompany() {
            try {
                const result = await axios.get("/api/employer/company", {
                    params: {
                        companyID: currentUser.companyID
                    },
                    withCredentials: true
                });
                console.log(result.data)
                setCompanyInfo(result.data);

            } catch (error) {
                console.error(error);
            }
        }

        fetchCompany();
    }, [currentUser?.companyID])

    useEffect(() => {
        async function getMembers() {
            try {
                const allMembers = await axios.get("/api/employer/companyMembers", {
                    params: {
                        companyID: currentUser.companyID,
                        employerID: currentUser.id
                    },
                    withCredentials: true
                });
                // console.log(allMembers.data.companyMembers)
                setCompanyMembers(allMembers.data.companyMembers);
            } catch (error) {
                console.error(error);
            } 
        }


        getMembers()
    }, [currentUser?.companyID, isRemoved])

    function handleEditCompanyBox() {
        setEditCompany(!editCompany);
    }

    async function removeEmployer() {
        setIsRemoving(true);
        try {
            await axios.delete("/api/employer/removeEmployer", {
                params: { memberID, companyID: companyInfo.companyID },
                withCredentials: true
            })
            setShowDelete(false);
            setShowConfirm(true)
            setIsRemoved(!isRemoved);

        } catch (error) {
            console.log(error);
        } finally {
            setIsRemoving(false);
        }
    }


    if (loading) {
        return <Loading />
    }

    if (!verified) {
        navigate("/forbidden");
    }


    return (
        <div className="lg:flex relative w-full">
            <SideBarOverlay />
            <EmployerSideBar />

            <div className="w-full min-h-screen bg-[#F3F4F6]">
                {
                    showInvite &&
                    <InviteEmployer 
                        cancelFunc={() => setShowInvite(false)}
                        setInviteSent={() => setInviteSent(true)}
                    />
                }

                {
                    inviteSent &&
                    <ConfirmationBox 
                        buttonText="Close" 
                        onClick={() => setInviteSent(false)} 
                        text="Email sent successfully" 
                    />
                }
                
                {editCompany && 
                    <>
                        <Translucent />
                        <EditCompany 
                            handleEditCompanyBox={handleEditCompanyBox}
                        />
                    </>
                }

                {
                    showDelete &&
                    <WarningBox
                        heading="Remove this employer?"
                        bodyText="This employer will be removed from your company profile, and their employer account will be permanently deleted. They will lose access to your company's job postings, applicants, and other employer features. This action cannot be undone."
                        buttonText="Remove"
                        isLoading={isRemoving}
                        toggleFunction={() => setShowDelete(false)}
                        deleteFunction={removeEmployer}
                    />
                }

                {
                    showConfirm &&
                    <ConfirmationBox 
                        text="Employer account removed successfully"
                        onClick={() => setShowConfirm(false)}
                    />
                }
                
                <AuthNavBar />

                <div className="w-full p-6 md:px-15 md:py-10 lg:px-20 xl:px-40">
                    <div className="w-full m-auto mb-5 md:w-100 lg:w-140 xl:w-170 bg-white shadow-md rounded-2xl">
                        <div className="w-full relative ">
                            <div className="w-full h-45 xl:h-70 overflow-hidden rounded-tr-2xl rounded-tl-2xl mb-5 lg:mb-0">
                                <img
                                    className="w-full h-full object-cover"
                                    src={companyInfo.coverPhotoURL ? `${companyInfo?.coverPhotoURL}` : defaultCover}
                                    alt="Cover Photo"
                                />
                            </div>

                            <div className="absolute left-5 top-45 -translate-y-1/2 w-23 h-23 rounded-xl border-5 border-white lg:hidden">
                                <img className="w-full h-full object-cover rounded-lg" src={companyInfo.profilePhotoURL ? `${companyInfo.profilePhotoURL}` : defaultCover} alt="Company Logo" />
                            </div>
                        </div>

                        <div className="relative px-5 py-7 lg:flex lg:justify-between">
                            <div className="w-full flex gap-5">
                                <div className="w-23 h-23 xl:w-30 xl:h-30 rounded-xl border-5 border-white hidden lg:block">
                                    <img className="w-full h-full object-cover rounded-lg" src={companyInfo.profilePhotoURL ? `${companyInfo.profilePhotoURL}` : defaultCover} alt="Company Logo" />
                                </div>                                
                                <div className="lg:max-w-55">
                                    <h1 className="font-bold text-2xl xl:text-3xl mb-1 wrap-break-word">{companyInfo.companyName}</h1>
                                    <p className="flex text-sm xl:text-lg items-center gap-2 text-gray-500 font-semibold wrap-break-word">
                                        <SlLocationPin />
                                        {companyInfo.location}
                                    </p>
                                </div>
                            </div>
                            {currentUser.role === "Admin Employer" &&
                                <PrimaryButton onClick={handleEditCompanyBox} className="mt-6 rounded-lg w-full flex justify-center items-center gap-2 text-sm font-bold md:text-[1rem] lg:w-fit lg:mt-0 lg:h-fit">
                                    <FiEdit size={15} />Edit&nbsp;Details
                                </PrimaryButton>
                            }
                        </div>
                    </div>

                        {/* <hr className="mt-10 mb-9 border-t-2 border-gray-300" /> */}
                    <div className="w-full p-5 m-auto md:w-100 lg:w-140 xl:w-170 xl:p-8 bg-white rounded-2xl shadow-md">
                        <div className=" w-full mb-5">
                            <div className="w-full mb-2">
                                <div className="flex items-center justify-between">
                                    <h1 className="font-bold text-[1.1rem] md:text-xl">Company employers</h1>
                                    {currentUser.role === "Admin Employer" && 
                                        <PrimaryButton onClick={() => setShowInvite(true)} className="flex items-center gap-1 text-[0.80rem] font-semibold md:text-[1rem] rounded-lg"><IoMdAdd size={18} />Invite</PrimaryButton>
                                    }
                                </div>
                            </div>
                            <p className="text-gray-500 font-medium text-sm">{`${companyMembers?.length} ${companyMembers.length > 1 ? "members" : "member"} have access`}</p>
                        </div>

                        <div className="w-full flex flex-col">
                            
                            {companyMembers?.map((member) => {
                                if (currentUser.role === "Admin Employer") {
                                    return (
                                        <div key={member.compMemID} className="w-full pt-3 border-t border-gray-300">
                                            <div data-member-menu className="relative">
                                                {
                                                    currentUser.id !== member.compMemID && 
                                                    <LuEllipsisVertical 
                                                        onClick={() => {
                                                            setMemberID(member.compMemID)
                                                            setShowMenu(!showMenu)
                                                        }} 
                                                        size={20} 
                                                        className="cursor-pointer ml-auto"
                                                    />
                                                }

                                                <div className={`absolute top-full right-0 mt-1 bg-slate-100 w-fit p-5 rounded-xl shadow-xl transition-opacity duration-150 ease-out ${(showMenu && memberID === member.compMemID) ? "opacity-100" : "opacity-0 pointer-events-none"}`} >
                                                    <Link 
                                                        to={`/employer/companyProfile/editPermission/${member.compMemID}`}
                                                        className="text-green-600 flex items-center gap-2 cursor-pointer font-semibold mb-2"
                                                    >
                                                        <FiEdit size={20} />
                                                        Edit Permission
                                                    </Link>                                            
                                                    <button 
                                                        onClick={() => {
                                                            setMemberID(member.compMemID)
                                                            setShowDelete(true)
                                                        }}
                                                        className="text-red-600 flex font-semibold items-center gap-2 cursor-pointer"
                                                    >
                                                        <IoPersonRemove size={20} />
                                                        Remove
                                                    </button>

                                                </div>   
                                                                                                                                             
                                            </div>
                                            
                                            <div className="w-full flex gap-3 xl:gap-6">
                                                <div className={`flex items-center justify-center w-13 h-13 shrink-0 px-2 rounded-md ${member.role === "Admin Employer" ? "bg-green-200" : "bg-gray-100 border border-gray-300"}`}>
                                                    <p className={`font-bold ${member.role === "Admin Employer" ? "text-green-700" : "text-gray-800"}`}>{`${member.firstName[0]}${member.lastName[0]}`}</p>
                                                </div>

                                                <div className="min-w-0">
                                                    <h1 className="font-bold wrap-break-word text-gray-00 text-lg mb-1">{member.firstName}&nbsp;{member.lastName}</h1>
                                                    <p className={`font-semibold mb-1 ${member.role === "Admin Employer" ? "text-green-700" : "text-gray-800"} text-sm md:text-[1rem]`}>{member.role}</p>
                                                    <p title={member.email} className="text-gray-500 mb-3 truncate text-sm">{member.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }

                                return (
                                    <div key={member.compMemID} className="w-full rounded-xl shadow-md bg-white p-4">
                                        <p className="font-semibold text-green-600 text-sm mb-5">{member.role}</p>
                                        <h1 className="font-bold text-lg">{member.firstName}&nbsp;{member.lastName}</h1>

                                        <p className="text-gray-500 font-medium">{member.email}</p>


                                    </div>
                                )                                      
                            })}
                        </div>
                    </div>

                </div>
                
            </div>
           
        </div>
    )
}
