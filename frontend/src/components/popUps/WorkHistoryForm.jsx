import { IoClose } from "react-icons/io5";
import PrimaryButton from "../buttons/PrimaryButton";
import { useState } from "react";
import Translucent from "../overlay/Translucent";
import axios from "axios";


export default function WorkHistoryForm({ toggleForm, refresh }) {

    const [workInfo, setWorkInfo] = useState({
        jobTitle: "",
        companyName: "",
        startDate: "",
        endDate: ""
    })

    const [errors, setErrors] = useState("");

    function cancelForm() {
        setWorkInfo({
            jobTitle: "",
            companyName: "",
            startDate: "",
            endDate: ""
        })

        toggleForm();
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const { startDate, endDate } = workInfo;

        if (startDate === "0000-00-00") {
            setErrors("Enter your starting date");
            return;
        }

        if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
            setErrors("End date should be greater than start date");
            return
        }

        try {
            await axios.post("/api/applicant/addWorkExp", workInfo, {
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

                <h1 className="font-bold text-lg mb-3 text-center">Work History</h1>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="title">Job Title</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="title"
                            value={workInfo.jobTitle}
                            onChange={(e) => setWorkInfo({...workInfo, jobTitle: e.target.value})}                       
                        />
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="company">Company Name</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="company"
                            value={workInfo.companyName}
                            onChange={(e) => setWorkInfo({...workInfo, companyName: e.target.value})}                       
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mb-4">
                        <div className="">
                            <label htmlFor="startDate">Start Date</label>
                            <input 
                                className="text-sm w-full p-2 border border-gray-400 rounded-md mt-1"
                                type="date"
                                required
                                id="startDate"
                                value={workInfo.startDate}
                                onChange={(e) => setWorkInfo({...workInfo, startDate: e.target.value})}                       
                            />
                        </div>

                        <div className="">
                            <label htmlFor="endDate">End Date</label>
                            <input 
                                className="text-sm w-full p-2 border border-gray-400 rounded-md mt-1"
                                type="date"
                                id="endDate"
                                value={workInfo.endDate}
                                onChange={(e) => setWorkInfo({...workInfo, endDate: e.target.value})}                       
                            />
                        </div>
                    </div>

                    {errors && <p>{errors}</p>}

                    <div className="w-full flex flex-col">
                        <PrimaryButton type="submit" className="w-full">Add</PrimaryButton>
                        <PrimaryButton onClick={toggleForm} className="w-full text-black! bg-[#F3F4F6]!">Cancel</PrimaryButton>
                    </div>
                </form>
            </div>
        </>
    )
}