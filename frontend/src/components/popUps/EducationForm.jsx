import { IoClose } from "react-icons/io5";
import PrimaryButton from "../buttons/PrimaryButton";
import { useState } from "react";
import Translucent from "../overlay/Translucent";
import api from "../../apis/axios.js";
import YearSelector from "../others/YearSelector";


export default function EducationForm({ toggleForm, refresh }) {
    const [isChecked, setIsChecked] = useState(false);

    const [educationInfo, setEducationInfo] = useState({
        courseName: "",
        institution: "",
        year: null,
        qualiComplete: false
    })

    const [errors, setErrors] = useState({});

    function handleCheckboxChange(event) {
        const checked = event.target.checked;
        setIsChecked(checked);
        setEducationInfo({...educationInfo, qualiComplete: checked})
    };

    
    async function handleSubmit(e) {
        e.preventDefault();

        try {
            await api.post("/applicant/addEducation", educationInfo)

            refresh();
            toggleForm();
        } catch (error) {
            console.log(error);

            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (issue) {
                setErrors({ [issue]: message }); 
            } else {
                setErrors({ general: "An error occurred. Please try again" });
            }              
        }
    }

    return (
        <>
            <Translucent />
        
            <div className="w-[85%] max-h-[90%] overflow-y-scroll scrollbar-none p-5 bg-[#F3F4F6] fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 rounded-2xl md:w-100 md:p-7 md:pt-10">
                <IoClose onClick={toggleForm} size={20} className="cursor-pointer absolute top-2 right-2 md:top-4 md:right-4 md:h-7 md:w-7" />

                <h1 className="font-bold text-xl mb-3 text-center">Education</h1>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="title">Finished Program</label>
                        <input 
                            type="text"
                            required
                            id="title"
                            value={educationInfo.courseName}
                            minLength={2}
                            maxLength={150}
                            onChange={(e) => setEducationInfo({...educationInfo, courseName: e.target.value})}                       
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidTitle ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {errors.invalidTitle && <p className="text-red-600 text-[13px] mb-4"> {errors.invalidTitle}</p>}
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="company">Institution</label>
                        <input 
                            type="text"
                            required
                            id="company"
                            value={educationInfo.institution}
                            minLength={2}
                            maxLength={200}
                            onChange={(e) => setEducationInfo({...educationInfo, institution: e.target.value})}                       
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidOrg ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {errors.invalidOrg && <p className="text-red-600 text-[13px] mb-4">{errors.invalidOrg}</p>}
                    </div>

                    <div className="w-full mb-4 flex gap-2 items-center">
                        <input 
                            type="checkbox"
                            id="option"
                            checked={isChecked}
                            onChange={handleCheckboxChange}                   
                            className="w-4 h-4 border border-gray-400 rounded-md"
                        />
                        <label htmlFor="option" className={isChecked ? "font-semibold duration-100 ease-out" : undefined}>Qaulification Complete</label>
                    </div>


                    <div className="flex flex-col w-full mb-4">
                        <div className="">
                            <p className="font-medium">{isChecked ? "Finished " : "Expected to finish " }<span className="text-gray-500">(optional)</span></p>
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