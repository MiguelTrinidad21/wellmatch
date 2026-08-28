import { IoClose } from "react-icons/io5";
import PrimaryButton from "../buttons/PrimaryButton";
import { useState } from "react";
import Translucent from "../overlay/Translucent";
import YearSelector from "../others/YearSelector";
import MonthSelector from "../others/MonthSelector";
import api from "../../apis/axios.js";


export default function WorkHistoryForm({ toggleForm, refresh }) {

    const [workInfo, setWorkInfo] = useState({
        jobTitle: "",
        companyName: "",
        startMonth: null,        
        startMonthLabel: null,   
        startYear: null,
        endMonth: null,          
        endMonthLabel: null,     
        endYear: null
    })

    const [errors, setErrors] = useState({});

    function cancelForm() {
        setWorkInfo({
            jobTitle: "",
            companyName: "",
            startMonth: null,
            startYear: null,
            endMonth: null,
            endYear: null
        })

        toggleForm();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const { startMonth, startYear, endMonth, endYear } = workInfo;

        if (!startMonth || !startYear || !endMonth || !endYear) {
            setErrors({
                incompleteYear: "Please fill out all blank fields"
            });
            return;
        }


        const start = new Date(startYear, startMonth);
        const end = new Date(endYear, endMonth);

        if (start >= end) {
            setErrors({
                invalidDate: "Start date must be before end date"
            });
            return;
        }

        try {
            await api.post("/applicant/addWorkExp", workInfo)

            refresh();
            toggleForm();
            setErrors({});
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
                <button onClick={toggleForm} className="cursor-pointer absolute top-2 right-2 md:top-4 md:right-4">
                    <IoClose className="cursor-pointer h-6 w-6 md:h-7 md:w-7" />                    
                </button>

                <h1 className="font-bold text-xl mt-6 md:mt-0 mb-3 text-center">Work History</h1>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex flex-col w-full mb-4">
                        <label className="font-medium" htmlFor="title">Job Title</label>
                        <input 
                            type="text"
                            required
                            id="title"
                            value={workInfo.jobTitle}
                            minLength={2}
                            maxLength={100}
                            onChange={(e) => setWorkInfo({...workInfo, jobTitle: e.target.value})}                       
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidTitle ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {errors.invalidTitle && <p className="text-red-600 text-[13px] mb-4"> {errors.invalidTitle}</p>}
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <label className="font-medium" htmlFor="company">Company Name</label>
                        <input 
                            type="text"
                            required
                            id="company"
                            value={workInfo.companyName}
                            minLength={2}
                            maxLength={100}
                            onChange={(e) => setWorkInfo({...workInfo, companyName: e.target.value})}                       
                            className={`p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${errors.invalidCompany ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"}`}
                        />
                        {errors.invalidCompany && <p className="text-red-600 text-[13px] mb-4">{errors.invalidCompany}</p>}
                    </div>

                    <div className="w-full mb-4">
                        <p className="font-medium mb-1">Start Date</p>
                        <div className="grid grid-cols-2 gap-3">
                            <MonthSelector onChange={(value, label) => setWorkInfo((prev) => ({
                                ...prev, 
                                startMonth: value,
                                startMonthLabel: label})
                            )}/>
                            <YearSelector isChecked={true} onChange={(startYear) => setWorkInfo((prev) => ({ ...prev, startYear }))} />
                        </div>      
                    </div>

                    <div className="w-full mb-4">
                        <p className="font-medium mb-1">End Date</p>
                        <div className="grid grid-cols-2 gap-3">
                            <MonthSelector onChange={(value, label) => setWorkInfo((prev) => ({
                                ...prev, 
                                endMonth: value,
                                endMonthLabel: label})
                            )}/>
                            <YearSelector isChecked={true} onChange={(endYear) => setWorkInfo((prev) => ({ ...prev, endYear }))} />
                        </div>      
                    </div>

                    {errors.invalidDate && <p className="text-red-600 text-[13px] mb-4">{errors.invalidDate}</p>}
                    {errors.incompleteYear && <p className="text-red-600 text-[13px] mb-4">{errors.incompleteYear}</p>}

                    <div className="w-full flex flex-col">
                        <PrimaryButton type="submit" className="w-full">Add</PrimaryButton>
                        <PrimaryButton onClick={toggleForm} className="w-full text-black! bg-[#F3F4F6]!">Cancel</PrimaryButton>
                    </div>
                </form>
            </div>
        </>
    )
}