import { IoClose } from "react-icons/io5";
import PrimaryButton from "../buttons/PrimaryButton";
import { useState } from "react";
import Translucent from "../overlay/Translucent";
import MonthSelector from "../others/MonthSelector";
import YearSelector from "../others/YearSelector";
import axios from "axios";


export default function CredentialsForm({ toggleForm, refresh }) {

    const [credentialInfo, setCredentialInfo] = useState({
        credentialTitle: "",
        issuedBy: "",
        startMonth: null,        
        startMonthLabel: null,   
        startYear: null,
        endMonth: null,          
        endMonthLabel: null,     
        endYear: null
    })

    const [errors, setErrors] = useState("");

    function cancelForm() {
        setCredentialInfo({
            credentialTitle: "",
            issuedBy: "",
            startMonth: null,        
            startMonthLabel: null,   
            startYear: null,
            endMonth: null,          
            endMonthLabel: null,     
            endYear: null
        })

        toggleForm();
    }
    
    async function handleSubmit(e) {
        e.preventDefault();

        const { startMonth, startYear, endMonth, endYear } = credentialInfo;

        if (!startMonth || !startYear) {
            setErrors("Please indicate the issue date");
            return;
        }

        const start = new Date(startYear, startMonth);
        const end = new Date(endYear, endMonth);

        if ((endMonth && endYear) && (start >= end)) {
            setErrors("Issue date must be before expiry date");
            return;
        }

        try {
            await axios.post("/api/applicant/addCredential", credentialInfo, {
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

                <h1 className="font-bold text-xl mb-3 text-center">Credentials</h1>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="title">License or certification name</label>
                        <input 
                            type="text"
                            required
                            id="title"
                            value={credentialInfo.credentialTitle}
                            onChange={(e) => setCredentialInfo({...credentialInfo, credentialTitle: e.target.value})}                       
                            className="p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600"
                        />
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="company">Issuing organisation</label>
                        <input 
                            type="text"
                            required
                            id="company"
                            value={credentialInfo.issuedBy}
                            onChange={(e) => setCredentialInfo({...credentialInfo, issuedBy: e.target.value})}                       
                            className="p-2 rounded-md block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600"
                        />
                    </div>

                    
                    <div className="w-full mb-4">
                        <p className="font-medium mb-1">Date Issued</p>
                        <div className="grid grid-cols-2 gap-3">
                            <MonthSelector onChange={(value, label) => setCredentialInfo((prev) => ({
                                ...prev, 
                                startMonth: value,
                                startMonthLabel: label})
                            )}/>
                            <YearSelector isChecked={true} onChange={(startYear) => setCredentialInfo((prev) => ({ ...prev, startYear }))} />
                        </div>      
                    </div>

                    <div className="w-full mb-4">
                        <p className="font-medium mb-1">Expiry Date&nbsp;<span className="text-gray-500">(optional)</span></p>
                        <div className="grid grid-cols-2 gap-3">
                            <MonthSelector onChange={(value, label) => setCredentialInfo((prev) => ({
                                ...prev, 
                                endMonth: value,
                                endMonthLabel: label})
                            )}/>
                            <YearSelector isChecked={true} onChange={(endYear) => setCredentialInfo((prev) => ({ ...prev, endYear }))} />
                        </div>      
                    </div>
                    
                    {errors && <p className="text-red-600 text-sm text-center mb-4">{errors}</p>}
                    <div className="w-full flex flex-col">
                        <PrimaryButton type="submit" className="w-full">Add</PrimaryButton>
                        <PrimaryButton onClick={toggleForm} className="w-full text-black! bg-[#F3F4F6]!">Cancel</PrimaryButton>
                    </div>
                </form>
            </div>
        </>
    )
}