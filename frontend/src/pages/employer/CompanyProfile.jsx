import Footer from "../../components/others/Footer";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Translucent from "../../components/overlay/Translucent";
import EditCompany from "../../components/popUps/EditCompany";
import Loading from "../../components/others/Loading";
import defaultCover from "../../assets/defaultCover.jpg"
import { IoMdAdd } from "react-icons/io";
import { MdClose } from "react-icons/md";
import { FiEdit } from "react-icons/fi";
import { useState, useEffect } from "react";
import { userStore } from "../../zustand/userState";
import { companyStore } from "../../zustand/stateHandlers";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CompanyProfile() {

    const { currentUser } = userStore();
    const { companyInfo, setCompanyInfo } = companyStore();
    const navigate = useNavigate();

    const [companyMembers, setCompanyMembers] = useState([]);
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editCompany, setEditCompany] = useState(false);


    useEffect(() => {
        async function checkEmployer() {
            try {
                console.log(currentUser);
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

        async function fetchCompany() {
            try {
                const result = await axios.get("/api/employer/company", {
                    params: {
                        companyID: currentUser.companyID
                    },
                    withCredentials: true
                });

                setCompanyInfo(result.data);
                console.log(result.data)
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
                    params: {companyID: currentUser.companyID},
                    withCredentials: true
                });
                console.log(allMembers.data.companyMembers)
                setCompanyMembers(allMembers.data.companyMembers);
            } catch (error) {
                console.error(error);
            } 
        }


        getMembers()
    }, [currentUser?.companyID])

    function handleEditCompanyBox() {
        setEditCompany(!editCompany);
    }


    if (loading) {
        return <Loading />
    }

    if (!verified) {
        navigate("/forbidden");
    }


    return (
        <>
            <div className="w-full min-h-screen p-6 bg-[#F9FAFB] relative">
                {editCompany && 
                    <>
                        <Translucent />
                        <EditCompany 
                            handleEditCompanyBox={handleEditCompanyBox}
                        />
                    </>
                }
                
                <AuthNavBar />
                <Overlay />
                
                <div className="w-full h-45 overflow-hidden rounded-xl mb-6">
                    <img
                        className="w-full h-full object-cover"
                        src={companyInfo.coverPhotoURL ? `${companyInfo?.coverPhotoURL}` : defaultCover}
                        alt="Cover Photo"
                    />
                </div>

                <div className="relative">
                    <div className="w-full flex gap-5">
                        <div className="w-25 h-25 rounded-lg">
                            <img className="w-full h-full object-cover rounded-lg" src={companyInfo.profilePhotoURL ? `${companyInfo.profilePhotoURL}` : defaultCover} alt="Company Logo" />
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl mb-2">{companyInfo.companyName}</h1>
                            <p>{companyInfo.location}</p>
                        </div>
                    </div>
                    {currentUser.role === "Admin Employer" &&
                        <PrimaryButton onClick={handleEditCompanyBox} className="mt-6 w-full flex justify-center items-center gap-2 text-sm font-bold">
                            <FiEdit size={15} />Edit Details
                        </PrimaryButton>
                    }
                </div>

                <hr className="mt-10 mb-9 border-t-2 border-gray-300" />

                <div className="w-full mb-2">
                    <div className="flex justify-between">
                        <h1 className="font-bold text-[1.1rem]">Company employers</h1>
                        {currentUser.role === "Admin Employer" && 
                            <PrimaryButton to="/employer/companyProfile/invite" className="flex items-center gap-1 text-[0.80rem] font-semibold"><IoMdAdd size={18} />Invite</PrimaryButton>
                        }
                    </div>
                </div>
                <p>{companyMembers?.length}&nbsp;members</p>

                <div className="w-full flex flex-col gap-6 mt-6">
                    
                    {companyMembers?.map((member) => {
                        if (currentUser.role === "Admin Employer") {
                            return (
                                <div key={member.compMemID} className="w-full rounded-xl shadow-md bg-white p-4">
                                    <h1 className="font-bold text-lg mb-1">{member.firstName}&nbsp;{member.lastName}</h1>
                                    <p className="text-sm">{member.role}</p>

                                    <div className="w-full flex justify-end gap-4 mt-4">
                                        <button className="font-bold text-red-600 text-sm">Remove</button>
                                        <SecondaryButton className="font-bold">Edit Permission</SecondaryButton>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div key={member.compMemID} className="w-full rounded-xl shadow-md bg-white p-4">
                                <p className="font-semibold text-green-600 text-sm mb-5">{member.role}</p>
                                <h1 className="font-bold text-lg">{member.firstName}&nbsp;{member.lastName}</h1>

                                <p className="text-gray-500">{member.email}</p>


                            </div>
                        )                                      
                    })}
                </div>
            </div>
            <Footer />
           
        </>
    )
}
