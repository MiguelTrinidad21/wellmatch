import { IoClose } from "react-icons/io5";
import { MdFileUpload } from "react-icons/md";
import PrimaryButton from "../buttons/PrimaryButton";
import { useState } from "react";
import Translucent from "../overlay/Translucent";
import axios from "axios";


export default function AddResumeForm({ toggleForm, refresh }) {
    const [resume, setResume] = useState(null);
    const [resumeFileName, setResumeFileName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    async function uploadResume() {
        setIsLoading(true);

        const formData = new FormData();

        if (!resume) {
            setErrors({ noResume: "Please select a resume to upload" })
            return;
        }
        
        formData.append("resume", resume);

        try {
            await axios.post("/api/applicant/uploadResume", formData, {
                withCredentials: true
            })

            refresh();
            toggleForm();
            
        } catch (error) {
            console.log(error);

            const message = error.response?.data?.message || "An error occurred";

            if (message) {
                setErrors({ message: message }); 
            } else {
                setErrors({ message: "Unable to connect to the server. Please try again." });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <Translucent />
        
            <div className="w-[85%] p-5 bg-[#F3F4F6] fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-50 rounded-2xl md:w-100 md:p-7 md:pt-10">
                <IoClose onClick={toggleForm} size={20} className="absolute top-2 right-2 md:top-4 md:right-4 md:h-7 md:w-7" />

                <h1 className="font-bold text-xl mb-3 text-center">Add resumé</h1>
                <p className="mb-3">Add up to 5 resumés. Accepted file type: pdf and docx (5MB limit)</p>
                
                <div className="mb-3 w-full h-50 flex flex-col justify-center items-center border-2 border-gray-500 border-dashed rounded-2xl ">
                    {resumeFileName && (
                        <p className="mb-2 text-sm font-medium text-gray-700">
                            {resumeFileName}
                        </p>
                    )}    

                    <label className="cursor-pointer text-black font-semibold bg-[#86EFAC] rounded-lg py-2 px-5 inline-flex" htmlFor="resume">
                        <MdFileUpload className="h-6 mr-3" />
                        {resumeFileName ? "Change Resumé" : "  Select resumé"}
                        <input 
                            type="file"
                            id="resume"
                            accept=".docx, .pdf"
                            onChange={(e) => {
                                const file = e.target.files[0]

                                if (!file) return;

                                setResume(file)
                                setResumeFileName(file.name)
                            }}
                            className="hidden"
                        />
                    </label>

                    {errors.message && <p className="text-red-600 text-[13px]   mt-3">{errors.message}</p>}

                </div>

                <div className="w-full flex flex-col">
                    <PrimaryButton disabled={isLoading} onClick={uploadResume}  className={`${isLoading && "disabled opacity-50"} w-full`}>Upload</PrimaryButton>
                    <PrimaryButton disabled={isLoading} onClick={toggleForm} className="w-full text-black! bg-[#F3F4F6]!">Cancel</PrimaryButton>
                </div>                
            </div>
        </>
    )
}