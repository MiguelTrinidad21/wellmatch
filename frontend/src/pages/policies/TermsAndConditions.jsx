import PublicNavBar from "../../components/navBars/PublicNavBar"
import Overlay from "../../components/overlay/OverlayMobile"
import { useState, useEffect } from "react"

export default function TermsAndConditions() {
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
                    <h1 className="text-2xl font-bold mb-2 md:text-4xl">WellMatch Terms and Conditions</h1>   
                    <p className="mb-2 font-medium">AI-Powered Semantic Job Matching System with Skill Gap Analysis Using OpenAI Embeddings</p>                    
                    <p className="mb-2 font-medium">Effective Date: August 27, 2026</p>
                    <p className="mb-5 font-medium">Last Updated: August 30, 2026</p>
                    <p className="mb-10">By creating an account or using WellMatch, you agree to these Terms and Conditions. Please read them carefully before using the System.</p>
                    
                    <section 
                        onClick={() => togglePolicy(1)} 
                        className="w-full p-3 rounded-xl shadow-md cursor-pointer bg-white mb-3"
                    >
                        <h2 
                            data-dropdown 
                            className={`font-semibold text-lg lg:text-xl ${(isDropDown && policyID === 1) ? "mb-4" : undefined}`}
                        >
                            1.&nbsp;&nbsp;About WellMatch
                        </h2>

                        {(isDropDown && policyID === 1) &&
                            <div>
                                <p className="mb-4">
                                    WellMatch is an AI-powered web-based job-matching system designed to help applicants find job opportunities, understand how their skills match job requirements, identify possible skill gaps, and receive upskilling recommendations.
                                </p>
                                <p className="mb-4">
                                    WellMatch also provides employers with tools for creating job posts, reviewing applicants, viewing skill gap reports, and managing applications.
                                </p>
                                <p className="">
                                    WellMatch is currently developed as a capstone project of the College of Computer Studies, Tarlac State University.
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
                            2.&nbsp;&nbsp;User Accounts
                        </h2>

                        {(isDropDown && policyID === 2) &&
                            <div>
                                <p className="mb-4">
                                    WellMatch provides different accounts and access levels for Applicants, Employers, and Admin Employers.
                                </p>
                                <p className="mb-4">
                                    Applicants may create an account, manage their profile, search and save jobs, apply for jobs, withdraw applications, and view application statuses and skill-gap results.
                                </p>
                                <p className="mb-4">
                                    Employers may register through an invitation, manage their profiles, create and manage job posts, review applicants, view skill-gap reports, and accept or reject applications.
                                </p>
                                <p className="mb-4">
                                    Admin Employers may register their company, invite other employers, and manage employer accounts and permissions within their company.
                                </p>
                                <p className="">
                                    You are responsible for providing accurate information when creating and using your account. You are also responsible for keeping your account credentials secure and for activities performed through your account.
                                </p>                     
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
                            3.&nbsp;&nbsp;Applicant Responsibilities
                        </h2>

                        {(isDropDown && policyID === 3) &&
                            <div>
                                <p className="mb-4">
                                    Applicants must provide truthful and accurate information in their profiles, resumes, skills, education, work experience, certifications, and job applications.
                                </p>

                                <p className="mb-4">Applicants should make sure that their resumes clearly and accurately describe their skills and qualifications because WellMatch uses the information in the submitted resume when performing AI-based skill analysis and job matching.</p>

                                <p className="">Submitting false, misleading, or inaccurate information may result in inaccurate matching results or may affect an employer's evaluation of an application.</p>                      
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
                            4.&nbsp;&nbsp;Employer Responsibilities
                        </h2>

                        {(isDropDown && policyID === 4) &&
                            <div>
                                <p className="mb-4">
                                    Employers are responsible for providing accurate and complete information when creating company profiles and job postings.
                                </p>

                                <p className="mb-4">Job descriptions, required and preferred skills, salary information, and experience requirements should accurately represent the available position.</p>

                                <p className="">Employers are responsible for reviewing applicants and making their own recruitment and hiring decisions. Employers should not rely only on WellMatch's match scores or skill gap reports when making employment decisions.</p>                           
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
                            5.&nbsp;&nbsp;Job Applications
                        </h2>

                        {(isDropDown && policyID === 5) &&
                            <div>
                                <p className="mb-4">
                                    Applicants may apply for available job positions through WellMatch and may withdraw an application when the System allows it.
                                </p>

                                <p className="mb-4">Application statuses may include Submitted, Shortlisted, Interview, Job Offers, and Not Selected. These statuses reflect the recruitment actions recorded by the employer.</p>

                                <p className="">Being shortlisted, scheduled for an interview, or receiving a job offer is determined by the employer and is not guaranteed by WellMatch.</p>
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
                            6.&nbsp;&nbsp;AI Matching and Skill Gap Analysis
                        </h2>

                        {(isDropDown && policyID === 6) &&
                            <div>
                                <p className="mb-4">
                                    WellMatch uses AI to extract skills from resumes and job descriptions, compare applicant skills with job requirements, generate match scores, identify possible skill gaps, and provide upskilling recommendations.
                                </p>

                                <p className="mb-4">The System uses <b>OpenAI GPT-5.4 mini</b> and <b>OpenAI text-embedding-3-large</b> for its AI-based processing.</p>

                                <p className="mb-4">AI results are based on the information provided by the applicant and employer. The results may be affected by the quality, organization, and clarity of resumes and job descriptions.</p>

                                <p className="">A skill identified as a gap does not necessarily mean that an applicant does not have that skill. It may simply mean that the skill was not clearly stated in the submitted resume.</p>
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
                            7.&nbsp;&nbsp;Match Scores Are Not a Guarantee
                        </h2>

                        {(isDropDown && policyID === 7) &&
                            <div>
                                <p className="mb-4">
                                    WellMatch's match score represents the percentage of skills identified by the AI in the applicant's resume that were matched with the skills stated in the job description.
                                </p>

                                <p className="mb-4">The score does not measure an applicant's actual ability, performance, personality, or overall suitability for a job.</p>

                                <p className="mb-4">AI-generated results may contain errors or may not recognize all relevant skills. Therefore, WellMatch does not guarantee that a high match score will result in an interview, job offer, or employment.</p>

                                <p className="">Employers should use the AI results only as a support tool and should conduct their own evaluation, such as interviews or skills demonstrations, before making hiring decisions.</p>
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
                            8.&nbsp;&nbsp;Upskilling Recommendations
                        </h2>

                        {(isDropDown && policyID === 8) &&
                            <div>
                                <p className="mb-4">WellMatch may provide recommendations intended to help applicants improve skills identified as gaps.
                                </p>

                                <p className="">These recommendations are generated using AI and are provided for general guidance. WellMatch does not guarantee that following a recommendation will result in acquiring a skill, passing an assessment, obtaining employment, or receiving a higher match score.</p>
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
                            9.&nbsp;&nbsp;System Limitations
                        </h2>

                        {(isDropDown && policyID === 9) &&
                            <div>
                                <p className="mb-4">WellMatch is a prototype web-based system and may have technical or functional limitations.
                                </p>

                                <p className="mb-4">The AI analysis currently supports English-language resumes and job descriptions only. The quality of results may be reduced when resumes are poorly organized, unclear, or difficult for the System to process.</p>

                                <p className="">WellMatch is designed to operate through modern web browsers and requires an internet connection. Some older browsers may not be supported.</p>
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
                            10.&nbsp;&nbsp;Prohibited Use
                        </h2>

                        {(isDropDown && policyID === 10) &&
                            <div>
                                <p className="mb-4">Users must not use WellMatch to:
                                </p>

                                <ul className="list-disc list-inside mb-4">
                                    <li>provide false or misleading information;</li>
                                    <li>create or use an account without proper authorization;</li>
                                    <li>impersonate another person or misuse a company's identity;</li>
                                    <li>access another user's account or information without authorization;</li>
                                    <li>interfere with, damage, or attempt to bypass the System's security or access controls; or</li>
                                    <li>use the System for purposes that are unlawful or inconsistent with its intended job-matching and recruitment functions.</li>
                                </ul>

                                <p className="">Employers and Admin Employers must only provide access to authorized members of their company.</p>
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
                            11.&nbsp;&nbsp;Applicant Information and Employer Access
                        </h2>

                        {(isDropDown && policyID === 11) &&
                            <div>
                                <p className="mb-4">Applicant information submitted through a job application may be viewed by the employer associated with that job posting, including relevant profile, resume, and skill-gap information.
                                </p>

                                <p className="mb-4">Employers must use applicant information only for legitimate recruitment-related activities and must not misuse or improperly disclose information obtained through WellMatch.
                                </p>

                                <p className="">Access to features and information is controlled according to the user's role and permissions.
                                </p>
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
                            12.&nbsp;&nbsp;Availability and Changes to the System
                        </h2>

                        {(isDropDown && policyID === 12) &&
                            <div>
                                <p className="mb-4">WellMatch may be updated, modified, temporarily unavailable, or have features changed as the System is developed and improved.
                                </p>                         

                                <p className="">Because WellMatch is a capstone prototype, uninterrupted availability and error-free operation cannot be guaranteed.
                                </p>
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
                            13.&nbsp;&nbsp;Privacy
                        </h2>

                        {(isDropDown && policyID === 13) &&
                            <div>
                                <p className="mb-4">Your use of WellMatch is also subject to the WellMatch Privacy Policy, which explains how personal information is collected, used, stored, protected, and shared.</p>

                                <p className="">By using WellMatch, you acknowledge that you have read and understood the Privacy Policy.</p>
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
                            14.&nbsp;&nbsp;Account Deletion
                        </h2>

                        {(isDropDown && policyID === 14) &&
                            <div>
                                <p className="mb-4">Users may request or perform account deletion through the available System features, subject to applicable requirements and information that may need to be retained.</p>

                                <p className="">After an account is deleted, access to its associated WellMatch features and information may no longer be available.</p>
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
                            15.&nbsp;&nbsp;Changes to These Terms
                        </h2>

                        {(isDropDown && policyID === 15) &&
                            <div>
                                <p className="mb-4">WellMatch may update these Terms and Conditions when the System, its features, or its policies change.</p>

                                <p className="">Updated Terms will be posted with a new effective date. Continued use of WellMatch after the updated Terms take effect means that you acknowledge the updated Terms.</p>
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
                            16.&nbsp;&nbsp;Applicable Law
                        </h2>

                        {(isDropDown && policyID === 16) &&
                            <div>
                                <p className="mb-4">These Terms and Conditions shall be interpreted in accordance with applicable laws of the Republic of the Philippines.</p>

                                <p className="">For questions regarding these Terms and Conditions, please contact the WellMatch project team through the contact information provided in the Privacy Policy.</p>
                            </div>
                        }
                    </section>
                </div>




            </main>
        </>
    )
}