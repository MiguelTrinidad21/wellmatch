import { IoClose } from "react-icons/io5";
import PrimaryButton from "../buttons/PrimaryButton";
import { useState } from "react";
import Translucent from "../overlay/Translucent";
import axios from "axios";


export default function CredentialsForm({ toggleForm, refresh }) {

    const [credentialInfo, setCredentialInfo] = useState({
        credentialTitle: "",
        issuedBy: "",
        issueDate: "",
        expiryDate: ""
    })

    function cancelForm() {
        setCredentialInfo({
            credentialTitle: "",
            issuedBy: "",
            issueDate: "",
            expiryDate: ""
        })

        toggleForm();
    }
    
    async function handleSubmit(e) {
        e.preventDefault();

        const { issueDate, expiryDate } = credentialInfo;

        if (issueDate === "0000-00-00") {
            setErrors("Enter your issue date");
            return;
        }

        if (new Date(issueDate).getTime() > new Date(expiryDate).getTime()) {
            setErrors("Expiry date should be greater than start date");
            return
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
        
            <div className="w-[85%] p-5 bg-[#F3F4F6] fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 rounded-2xl">
                <IoClose onClick={toggleForm} size={20} className="absolute top-2 right-2" />

                <h1 className="font-bold text-lg mb-3 text-center">Credentials</h1>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="title">License or certification name</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="title"
                            value={credentialInfo.credentialTitle}
                            onChange={(e) => setCredentialInfo({...credentialInfo, credentialTitle: e.target.value})}                       
                        />
                    </div>

                    <div className="flex flex-col w-full mb-4">
                        <label htmlFor="company">Issuing organisation</label>
                        <input 
                            className="w-full p-2 border border-gray-400 rounded-md mt-1"
                            type="text"
                            required
                            id="company"
                            value={credentialInfo.issuedBy}
                            onChange={(e) => setCredentialInfo({...credentialInfo, issuedBy: e.target.value})}                       
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mb-4">
                        <div className="">
                            <label htmlFor="issueDate">Issuing Date</label>
                            <input 
                                className="text-sm w-full p-2 border border-gray-400 rounded-md mt-1"
                                type="date"
                                required
                                id="issueDate"
                                value={credentialInfo.issueDate}
                                onChange={(e) => setCredentialInfo({...credentialInfo, issueDate: e.target.value})}                       
                            />
                        </div>

                        <div className="">
                            <label htmlFor="expiryDate">Expiry Date</label>
                            <input 
                                className="text-sm w-full p-2 border border-gray-400 rounded-md mt-1"
                                type="date"
                                id="expiryDate"
                                value={credentialInfo.expiryDate}
                                onChange={(e) => setCredentialInfo({...credentialInfo, expiryDate: e.target.value})}                       
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