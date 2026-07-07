import { IoClose } from "react-icons/io5";
import PrimaryButton from "../buttons/PrimaryButton";
import { useState } from "react";
import Translucent from "../overlay/Translucent";
import axios from "axios";
import YearSelector from "../others/YearSelector";


export default function EducationForm({ toggleForm, refresh }) {
    const [isChecked, setIsChecked] = useState(false);

    const [educationInfo, setEducationInfo] = useState({
        courseName: "",
        institution: "",
        year: null,
        qualiComplete: false
    })


    function handleCheckboxChange(event) {
        const checked = event.target.checked;
        setIsChecked(checked);
        setEducationInfo({...educationInfo, qualiComplete: checked})
    };

    function cancelForm() {
        setEducationInfo({
            courseName: "",
            institution: "",
            year: null,
            qualiComplete: false
        })

        toggleForm();
    }
    
    async function handleSubmit(e) {
        e.preventDefault();

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
        
            <div className="w-[85%] p-5 bg-[#F3F4F6] fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 rounded-2xl md:w-100 md:p-7 md:pt-10">
                <IoClose onClick={toggleForm} size={20} className="absolute top-2 right-2 md:top-4 md:right-4 md:h-7 md:w-7" />

                <h1 className="font-bold text-xl mb-3 text-center">Education</h1>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="title">Finished Program</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="title"
                            value={educationInfo.courseName}
                            onChange={(e) => setEducationInfo({...educationInfo, courseName: e.target.value})}                       
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
                            onChange={(e) => setEducationInfo({...educationInfo, institution: e.target.value})}                       
                        />
                    </div>

                    <div className="w-full mb-4 flex gap-2 items-center">
                        <input 
                            className="w-4 h-4 border border-gray-400 rounded-md"
                            type="checkbox"
                            id="option"
                            checked={isChecked}
                            onChange={handleCheckboxChange}                   
                        />
                        <label htmlFor="option" className={isChecked ? "font-semibold duration-100 ease-out" : undefined}>Qaulification Complete</label>
                    </div>


                    <div className="flex flex-col w-full mb-4">
                        <div className="">
                            <p className="font-medium">{isChecked ? "Finished " : "Expected finish " }<span className="text-gray-500">(optional)</span></p>
                            <YearSelector isChecked={isChecked} onChange={(year) => setEducationInfo((prev) => ({ ...prev, year }))} />
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