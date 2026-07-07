import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer"
import Loading from "../../components/others/Loading"
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import { FaCheck } from "react-icons/fa6";
import { userStore } from "../../zustand/userState";
import { useState, useEffect } from "react"
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import PrimaryButton from "../../components/buttons/PrimaryButton";

export default function EditPermission(req, res) {
    const navigate = useNavigate();
    const { currentUser } = userStore();
    const { memberID } = useParams();

    const [employerInfo, setEmployerInfo] = useState({});
    const [role, setRole] = useState("Employer");

    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);

    const adminPrivelages = [
        {
            header: "Company Profile Management",
            text: "Manage company profile information within the system."
        },
        {
            header: "Employer Account Management",
            text: "Manage employer accounts and oversee employer access within the organization."
        },
        {
            header: "Co-Employer Invitations",
            text: "Send account registration invitations to co-employers through email access."
        },
        {
            header: "Full Employer Access",
            text: "Access all employer module features, including job posting, applicant management, skill gap reports, and application decisions."
        }
    ]

    const employerPrivelages = [
        {
            header: "Job Management",
            text: "Create job posts and manage open and closed job listings."
        },
        {
            header: "Applicant Access",
            text: "View all new and previous applicants for job posts, including application records."
        },
        {
            header: "Skill Gap Reports",
            text: "Review applicant skill gap analysis reports to evaluate qualifications and missing competencies."
        },
        {
            header: "Application Management",
            text: "Accept or reject applications based on applicant evaluation."
        },
        {
            header: "Account & Profile Management",
            text: "Register through invitation and update employer profile details."
        }
    ]

    async function editPermission() {
        try {
            console.log(role)
            await axios.patch("/api/employer/editPermission", 
                {memberID, role}, 
                {withCredentials: true}
            );

            setShowConfirm(true);
            
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        async function getEmployerInfo() {
            try {
                const res = await axios.get("/api/employer/getEmployerInfo", {
                    params: { memberID },
                    withCredentials: true
                });

                setEmployerInfo(res.data);

            } catch (error) {
                console.log(error);
            }
        }

        getEmployerInfo();
    }, [])

    useEffect(() => {
        async function checkAdmin() {
            try {
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    setVerified(false);
                    return;
                }

                await axios.get("/api/employer/authorizeAdmin", {
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

        checkAdmin();
    }, [currentUser]);

    useEffect(() => {
        if (!loading && !verified) {
            navigate("/forbidden");
        }
    }, [loading, verified, navigate]);

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

                {
                    showConfirm &&
                    <ConfirmationBox 
                        text="Role updated successfully"
                        onClick={() => {
                            setShowConfirm(false);
                            navigate("/employer/companyProfile")
                        }}
                    />
                }

                <div className="w-full p-6">
                    <h1 className="font-bold text-2xl mb-4">Individual Details</h1>

                    <section className="flex gap-4 w-full">
                        <div className="w-15 h-15 p-2 bg-green-600 font-bold text-white text-2xl rounded-full flex items-center justify-center">
                            {`${employerInfo.firstName?.charAt(0)}${employerInfo.lastName?.charAt(0)}`}
                        </div>

                        <div className="flex-1">
                            <h2 className="font-bold text-lg mb-1">{employerInfo.firstName}&nbsp;{employerInfo.lastName}</h2>
                            <p>{employerInfo.email}</p>
                        </div>
                    </section>

                    <hr className="my-5 bg-gray-400 h-0.5 border-none"/>

                    <section className="w-full">
                        <h1 className="text-2xl font-bold mb-1">Role Permissions</h1>
                        <p>Select the access level for this user.</p>

                        <div 
                            onClick={() => setRole("Employer")}
                            className={`w-full border-2 rounded-2xl p-4 my-6 ${role === "Employer" ? "border-green-600 bg-[#D5F7E3]" : "border-gray-400 bg-white"}`}
                        >
                            <div className="flex gap-2 items-center mb-2">
                                <input 
                                    type="radio"
                                    id="employer"
                                    name="role"
                                    value="Employer"
                                    onChange={(e) => setRole(e.target.value)}
                                    checked={role === "Employer"}
                                    className="w-5 h-5"
                                />
                                <label className="text-lg font-bold" htmlFor="employer">Employer</label>
                            </div>

                            <div className="w-full pl-7">
                                {
                                    employerPrivelages.map((item) => (
                                        <div key={item.header} className="w-full">
                                            <h1 className="font-semibold mb-1 flex gap-2 items-center">
                                                <FaCheck />
                                                {item.header}
                                            </h1>
                                            <p className="pl-6 mb-3 text-sm">{item.text}</p>
                                        </div>
                                    ))
                                }
                            </div>

                        </div>

                        <div
                            onClick={() => setRole("Admin Employer")}
                            className={`w-full border-2 rounded-2xl p-4 mb-6 ${role === "Admin Employer" ? "border-green-600 bg-[#D5F7E3]" : "border-gray-400 bg-white"}`}
                        >
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="radio"
                                    id="admin"
                                    name="role"
                                    value="Admin Employer"
                                    onChange={(e) => setRole(e.target.value)}
                                    checked={role === "Admin Employer"}
                                    className="w-5 h-5"
                                />
                                <label className="text-lg font-bold" htmlFor="admin">Administrator</label>
                            </div>

                            <div className="w-full pl-7">
                                {
                                    adminPrivelages.map((item) => (
                                        <div key={item.header} className="w-full">
                                            <h1 className="font-semibold mb-1 flex gap-2 items-center">
                                                <FaCheck />
                                                {item.header}
                                            </h1>
                                            <p className="pl-6 mb-3 text-sm">{item.text}</p>
                                        </div>
                                    ))
                                }
                            </div>                            
                        </div>
                    </section>

                    <section className="flex gap-3 justify-end">
                        <PrimaryButton to="/employer/companyProfile" className="bg-slate-100 border-2 border-slate-400 text-black!">Cancel</PrimaryButton>
                        <PrimaryButton onClick={editPermission}>Save Changes</PrimaryButton>
                    </section>
                </div>
            </div>

            <Footer />
        </>
    )
}