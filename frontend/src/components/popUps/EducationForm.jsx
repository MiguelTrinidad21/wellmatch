import { IoClose } from "react-icons/io5";
import PrimaryButton from "../buttons/PrimaryButton";
import { useState } from "react";
import Translucent from "../overlay/Translucent";
import axios from "axios";


export default function EducationForm({ toggleForm, refresh }) {

    const [educationInfo, setCredentialInfo] = useState({
        courseName: "",
        institution: "",
        graduatedAt: ""
    })

    function cancelForm() {
        setCredentialInfo({
            courseName: "",
            institution: "",
            graduatedAt: ""
        })

        toggleForm();
    }
    
    async function handleSubmit(e) {
        e.preventDefault();

        const { graduatedAt } = educationInfo;

        if (graduatedAt === "0000-00-00") {
            setErrors("Enter your graduation date");
            return;
        }


        try {
            await axios.post("/api/applicant/addEducation", educationInfo, {
                withCredentials: true
            })

            refresh();
            toggleForm();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
            <Translucent />
        
            <div className="w-[85%] p-5 bg-[#F3F4F6] fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 rounded-2xl">
                <IoClose onClick={toggleForm} size={20} className="absolute top-2 right-2" />

                <h1 className="font-bold text-lg mb-3 text-center">Education</h1>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="title">Finished Program</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="title"
                            value={educationInfo.courseName}
                            onChange={(e) => setCredentialInfo({...educationInfo, courseName: e.target.value})}                       
                        />
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="company">Institution</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="company"
                            value={educationInfo.institution}
                            onChange={(e) => setCredentialInfo({...educationInfo, institution: e.target.value})}                       
                        />
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <div className="">
                            <label htmlFor="graduatedAt">Graduated At</label>
                            <input 
                                className="text-sm w-full p-2 border border-gray-400 rounded-md mt-1"
                                type="date"
                                required
                                id="graduatedAt"
                                value={educationInfo.graduatedAt}
                                onChange={(e) => setCredentialInfo({...educationInfo, graduatedAt: e.target.value})}                       
                            />
                        </div>
                    </div>

                    <div className="w-full flex flex-col">
                        <PrimaryButton type="submit" className="w-full">Add</PrimaryButton>
                        <PrimaryButton onClick={toggleForm} className="w-full text-black! bg-[#F3F4F6]!">Cancel</PrimaryButton>
                    </div>
                </form>
            </div>
        </>
    )
}