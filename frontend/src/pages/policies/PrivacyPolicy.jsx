import PublicNavBar from "../../components/navBars/PublicNavBar"
import Overlay from "../../components/overlay/OverlayMobile"
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import { useState, useEffect } from "react"

export default function PrivacyPolicy() {
    const [isDropDown, setIsDropDown] = useState(false);
    const [policyID, setPolicyID] = useState(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (!event.target.closest("[data-dropdown]")) {
                setIsDropDown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function togglePolicy(id) {
        setPolicyID(id);
        setIsDropDown(!isDropDown);
    }

    return(
        <>
            <main className="w-full min-h-screen bg-[#F3F4F6] relative p-6 md:p-15">
                <PublicNavBar />
                <Overlay />

                <div className="m-auto w-full lg:w-150 xl:w-200 ">
                    <h1 className="text-2xl font-bold mb-2 md:text-4xl">WellMatch Privacy Policy</h1>   
                    <p className="mb-2">AI-Powered Semantic Job Matching System with Skill Gap Analysis Using OpenAI Embeddings</p>                    
                    <p className="mb-2">Effective Date: August 27, 2026</p>
                    <p className="mb-10">Last Updated: August 30, 2026</p>
                    
                    <section 
                        onClick={() => togglePolicy(1)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 1) ? "mb-4" : undefined}`}
                        >
                            1.&nbsp;&nbsp;Introduction and Scope
                        </h2>

                        {(isDropDown && policyID === 1) &&
                            <div>
                                <p className="mb-4">
                                    WellMatch is an AI-powered job-matching system that helps applicants find suitable job opportunities and understand the skills they may need. It also helps employers review applicants based on their profiles, resumes, skills, qualifications, and job requirements.
                                </p>
                                <p className="mb-4">
                                    This Privacy Policy explains what personal information WellMatch collects, how we use and protect it, who may access it, and what privacy rights you have.
                                </p>
                                <p className="">
                                    This policy applies to Applicants and Employers who use WellMatch. WellMatch is currently developed as a capstone project of the College of Computer Studies, Tarlac State University.
                                </p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(2)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 2) ? "mb-4" : undefined}`}
                        >
                            2.&nbsp;&nbsp;Personal Information We Collect
                        </h2>

                        {(isDropDown && policyID === 2) &&
                            <div>
                                <p className="mb-4">
                                    Depending on how you use WellMatch, we may collect the following information.
                                </p>

                                <div className="mb-4">
                                    <h2 className="font-semibold mb-3">Applicants</h2>
                                    <ul className="list-disc list-inside">
                                        <li>First and last name</li>
                                        <li>Address and email address</li>
                                        <li>Password and account information</li>
                                        <li>Profile picture and personal summary</li>
                                        <li>Skills, education, work experience, licenses, and certifications</li>
                                        <li>Resume</li>
                                        <li>Years of experience provided when applying for a job</li>
                                        <li>Job applications and application status</li>
                                        <li>Saved jobs</li>
                                        <li>AI-generated match scores, matched and missing skills, skill-gap results, and upskilling recommendations</li>
                                    </ul>
                                </div>

                                <div className="mb-4">
                                    <h2 className="font-semibold mb-3">Employers</h2>
                                    <ul className="list-disc list-inside">
                                        <li>Name, work email address, and password</li>
                                        <li>Company name and address</li>
                                        <li>Company profile and cover photos</li>
                                        <li>Job postings, descriptions, salary information, required or preferred skills, and experience requirements</li>
                                        <li>Applicant and recruitment information related to their job postings</li>
                                        <li>Employer invitations, roles, and account permissions</li>
                                    </ul>
                                </div>
                                
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(3)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 3) ? "mb-4" : undefined}`}
                        >
                            3.&nbsp;&nbsp;How We Collect and Use Your Information
                        </h2>

                        {(isDropDown && policyID === 3) &&
                            <div>
                                <p className="mb-4">
                                    We collect information directly from you when you register, update your profile, upload a resume, apply for a job, create a job post, manage an employer account, or use other WellMatch features.
                                </p>

                                <p className="mb-4">We use your information to:</p>

                                <ul className="list-disc list-inside">
                                    <li>create and manage accounts and profiles;</li>
                                    <li>process resumes and job postings;</li>
                                    <li>process and manage job applications;</li>
                                    <li>identify skills from resumes and job descriptions;</li>
                                    <li>match applicants with job opportunities;</li>
                                    <li>identify matched and missing skills;</li>
                                    <li>provide skill-gap and upskilling recommendations;</li>
                                    <li>help employers review applicants;</li>
                                    <li>send account, invitation, and system notifications; and</li>
                                    <li>maintain the security and proper operation of WellMatch.</li>
                                </ul>                            
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(4)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 4) ? "mb-4" : undefined}`}
                        >
                            4.&nbsp;&nbsp;Lawful Basis for Processing
                        </h2>

                        {(isDropDown && policyID === 4) &&
                            <div>
                                <p className="mb-4">
                                    WellMatch processes personal information only when allowed under the Philippine Data Privacy Act of 2012 (RA 10173) and other applicable requirements.
                                </p>

                                <p className="mb-4">Depending on the activity, processing may be based on:</p>

                                <ul className="list-disc list-inside">
                                    <li>your consent;</li>
                                    <li>providing the services you request;</li>
                                    <li>compliance with a legal requirement; or</li>
                                    <li>legitimate interests, such as maintaining system security and preventing misuse.</li>
                                </ul>                            
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(5)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 5) ? "mb-4" : undefined}`}
                        >
                            5.&nbsp;&nbsp;AI and Automated Processing
                        </h2>

                        {(isDropDown && policyID === 5) &&
                            <div>
                                <p className="mb-4">
                                    WellMatch uses AI and automated processing to:
                                </p>

                                <ul className="list-disc list-inside mb-4">
                                    <li>extract skills from resumes and job descriptions;</li>
                                    <li>compare applicant skills with job requirements;</li>
                                    <li>calculate job-match scores;</li>
                                    <li>identify possible skill gaps; and</li>
                                    <li>provide upskilling recommendations.</li>
                                </ul>

                                <p className="mb-4">WellMatch uses OpenAI services for these functions, including GPT-5.4 mini for skill extraction and recommendations and text-embedding-3-large for semantic similarity comparison.</p>

                                <p className="mb-4">AI results depend on the information submitted to WellMatch. Incomplete information, unclear job descriptions, resume formatting, or limitations of AI may affect the results.</p>

                                <p className="mb-4">A skill gap does not necessarily mean that an applicant does not have a skill. It may mean that the skill was not clearly stated in the submitted resume.</p>

                                <p className="">AI-generated match scores and skill-gap results are used as decision-support tools. They do not determine an applicant's actual ability and should not replace human evaluation by employers.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(6)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 6) ? "mb-4" : undefined}`}
                        >
                            6.&nbsp;&nbsp;Disclosure and Access to Personal Information
                        </h2>

                        {(isDropDown && policyID === 6) &&
                            <div>
                                <p className="mb-4">
                                    Access to personal information depends on the user's role.
                                </p>

                                <p className="mb-4">Applicants can access their own profiles, resumes, applications, saved jobs, recommendations, and skill-gap results.</p>

                                <p className="mb-4">Employers can access applicant information related to their job postings, including relevant profiles, resumes, and skill-gap results, as allowed by the System.</p>

                                <p className="mb-4">Admin Employers can manage employer accounts, invitations, and permissions.</p>

                                <p className="">We do not sell personal information. We may disclose information when required by law, court order, or other valid legal process.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(7)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 7) ? "mb-4" : undefined}`}
                        >
                            7.&nbsp;&nbsp;Third-Party Services and Data Storage
                        </h2>

                        {(isDropDown && policyID === 7) &&
                            <div>
                                <p className="mb-4">
                                    WellMatch uses third-party services to support its operations, including:
                                </p>

                                <ul className="list-disc list-inside mb-4">
                                    <li><b>OpenAI</b> – AI-based skill extraction, job matching, and recommendations</li>
                                    <li><b>Cloudinary</b> – storage of resumes and profile images</li>
                                    <li><b>Brevo</b> – employer invitations and system transactional emails</li>
                                    <li><b>MySQL</b> – structured data storage</li>
                                    <li><b>Railway</b> – backend and database hosting</li>
                                    <li><b>Vercel</b> – frontend hosting</li>
                                </ul>

                                <p className="mb-4">These providers may process information as necessary to provide their services to WellMatch and have their own privacy and security practices.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(8)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 8) ? "mb-4" : undefined}`}
                        >
                            8.&nbsp;&nbsp;Data Retention
                        </h2>

                        {(isDropDown && policyID === 8) &&
                            <div>
                                <p className="mb-4">We keep personal information only for as long as it is needed for the purposes described in this Privacy Policy, unless a longer period is required or allowed by law.
                                </p>

                                <p className="mb-4">Account, profile, resume, application, job-posting, and skill-analysis information may be retained while the related account or service is active.</p>

                                <p className="">When information is no longer needed and there is no legal reason to keep it, we will delete or securely dispose of it.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(9)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 9) ? "mb-4" : undefined}`}
                        >
                            9.&nbsp;&nbsp;Data Security, Sessions, and Authentication
                        </h2>

                        {(isDropDown && policyID === 9) &&
                            <div>
                                <p className="mb-4">WellMatch uses reasonable security measures to protect personal information. These include password hashing, secure authentication, role-based access controls, and HTTPS for data transmitted between the application and backend.
                                </p>

                                <p className="mb-4">Information is stored using the System's database and file-storage services and is accessed according to the user's role and permissions.</p>

                                <p className="mb-4">WellMatch uses authentication technologies, including JSON Web Tokens (JWTs), to maintain secure sessions and verify requests. These technologies are used for security and authentication and are not used for advertising or cross-site tracking.</p>

                                <p className="">No online system can be guaranteed to be completely secure. Therefore, we cannot guarantee absolute security of personal information.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(10)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 10) ? "mb-4" : undefined}`}
                        >
                            10.&nbsp;&nbsp;Cross-Border Processing
                        </h2>

                        {(isDropDown && policyID === 10) &&
                            <div>
                                <p className="mb-4">Some third-party providers used by WellMatch may store or process personal information outside the Philippines.
                                </p>

                                <p className="">When information is processed internationally, WellMatch takes reasonable steps to protect personal information and comply with applicable Philippine data privacy requirements.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(11)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 11) ? "mb-4" : undefined}`}
                        >
                            11.&nbsp;&nbsp;Accuracy and User Responsibility
                        </h2>

                        {(isDropDown && policyID === 11) &&
                            <div>
                                <p className="mb-4">Users are responsible for providing accurate, complete, and up-to-date information.
                                </p>

                                <p className="mb-4">Applicants should keep their profiles, resumes, skills, education, work experience, certifications, and application information accurate.
                                </p>

                                <p className="mb-4">Employers should provide accurate company information, job descriptions, salary information, and job requirements.
                                </p>

                                <p className="">Because WellMatch's AI features depend on the information provided, incomplete or unclear information may affect match scores, skill-gap results, and recommendations.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(12)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 12) ? "mb-4" : undefined}`}
                        >
                            12.&nbsp;&nbsp;Data Subject Rights
                        </h2>

                        {(isDropDown && policyID === 12) &&
                            <div>
                                <p className="mb-4">Under the Data Privacy Act of 2012, you may have the right to:
                                </p>

                                <ul className="list-disc list-inside mb-4">
                                    <li>be informed about how your personal information is processed;</li>
                                    <li>access your personal information;</li>
                                    <li>correct inaccurate or incomplete information;</li>
                                    <li>object to certain processing where allowed by law;</li>
                                    <li>request deletion, blocking, or restriction where allowed by law;</li>
                                    <li>withdraw consent when consent is the legal basis;</li>
                                    <li>request data portability where applicable;</li>
                                    <li>seek compensation where provided by law; and</li>
                                    <li>file a complaint with the National Privacy Commission.</li>
                                </ul>                            

                                <p className="mb-4">To exercise your rights or raise a privacy concern, contact us using the information in Section 13.
                                </p>

                                <p className="">We may ask you to verify your identity before acting on certain requests.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(13)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 13) ? "mb-4" : undefined}`}
                        >
                            13.&nbsp;&nbsp;Personal Information Controller and Privacy Contact
                        </h2>

                        {(isDropDown && policyID === 13) &&
                            <div>
                                <p className="mb-2"><b>Organization/Institution:</b>&nbsp;College of Computer Studies, Tarlac State University</p>
                                <p className="mb-2 "><b>Project:</b>&nbsp;WellMatch</p>
                                <p className="mb-2 wrap-break-word"><b>Privacy Contact:</b>&nbsp;ai.wellmatch@gmail.com</p>
                                <p className="mb-4"><b>Address:</b>&nbsp;College of Computer Studies, Tarlac State University – San Isidro Campus, Brgy. San Isidro, Tarlac City, Tarlac, 2300, Philippines
                                </p>

                                <p className="">We may ask you to verify your identity before acting on certain requests.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(14)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 14) ? "mb-4" : undefined}`}
                        >
                            14.&nbsp;&nbsp;Data Breach and Security Incidents
                        </h2>

                        {(isDropDown && policyID === 14) &&
                            <div>
                                <p className="mb-4">If a security incident involving personal information occurs, WellMatch will take reasonable steps to investigate, contain, and address the incident.</p>

                                <p className="">When a personal data breach requires notification under applicable law, WellMatch will notify the National Privacy Commission and affected data subjects within the required period.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(15)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 15) ? "mb-4" : undefined}`}
                        >
                            15.&nbsp;&nbsp;Account and Personal Information Deletion
                        </h2>

                        {(isDropDown && policyID === 15) &&
                            <div>
                                <p className="mb-4">You may request deletion of your WellMatch account and personal information, subject to information that we are required or legally allowed to retain.</p>

                                <p className="mb-4">Applicants and Employers may delete their accounts through the System when the account-deletion feature is available. Requests involving Admin Employer accounts or company information may be submitted to the privacy contact in Section 13.</p>

                                <p className="">When personal information is no longer needed and there is no legal reason to retain it, we will take appropriate steps to delete or securely dispose of it.</p>
                            </div>
                        }
                    </section>

                    <section 
                        onClick={() => togglePolicy(16)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 16) ? "mb-4" : undefined}`}
                        >
                            16.&nbsp;&nbsp;Changes to This Policy and Applicable Law
                        </h2>

                        {(isDropDown && policyID === 16) &&
                            <div>
                                <p className="mb-4">WellMatch may update this Privacy Policy when its services, processing activities, or applicable privacy requirements change.</p>

                                <p className="mb-4">Updated versions will include a revised effective date and will be made available through WellMatch.</p>

                                <p className="">WellMatch handles personal information in accordance with applicable Philippine privacy laws, including the Data Privacy Act of 2012 (RA 10173), its Implementing Rules and Regulations, and applicable National Privacy Commission issuance.</p>
                            </div>
                        }
                    </section>
                </div>




            </main>
        </>
    )
}