import PrimaryButton from "../buttons/PrimaryButton"
import { userStore } from "../../zustand/userState"
import { useState, useEffect } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import axios from "axios";

export default function EditPersonalDetails({ cancelFunc, userType }) {
    const forEmployers = userType === "employer" || "admin"

    const { currentUser, handleCurrentUser } = userStore();

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const [newInfo, setNewInfo] = useState({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email
    });

    async function handleSubmit(e) {
        e.preventDefault();

        setIsLoading(true);

        try {
            if (forEmployers) {
                await axios.patch("/api/employer/editPersonalDetails", newInfo,
                    {withCredentials: true}
                );
            } else {
                await axios.patch("/api/applicant/editPersonalDetails", newInfo,
                    {withCredentials: true}
                );
            }

            handleCurrentUser({
                ...currentUser,
                firstName: newInfo.firstName,
                lastName: newInfo.lastName,
                email: newInfo.email
            })

            setIsLoading(false);
            cancelFunc();

        } catch (error) {
            setIsLoading(false)
            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (issue) {
                setErrors({ [issue]: message }); 
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            }
        }
    }

    return (
        <div className="rounded-2xl bg-[#F9FAFB] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 w-82.5 z-30 ">
            <h1 className="font-bold text-xl mb-5 text-center">Update Details</h1>
            <form onSubmit={handleSubmit} >
                <label htmlFor="firstName" className="font-semibold block mb-2">First Name</label>
                <input 
                    className="w-full p-2 text-md bg-gray-100 border border-gray-400 rounded-md mb-5" 
                    type="text"
                    id="firstName"
                    value={newInfo.firstName}
                    onChange={(e) => 
                        setNewInfo({...newInfo, firstName: e.target.value})
                    }
                    required 
                />

                <label htmlFor="firstName" className="font-semibold block mb-2">Last Name</label>
                <input 
                    className="w-full p-2 text-md bg-gray-100 border border-gray-400 rounded-md mb-5" 
                    type="text"
                    id="lastName"
                    value={newInfo.lastName}
                    onChange={(e) => 
                        setNewInfo({...newInfo, lastName: e.target.value})
                    }
                    required 
                />

                <label htmlFor="email" className="font-semibold block mb-2">Email Address</label>
                <input 
                    className="w-full p-2 text-md bg-gray-100 border border-gray-400 rounded-md mb-3" 
                    type="email"
                    id="email"
                    value={newInfo.email}
                    onChange={(e) => 
                        setNewInfo({...newInfo, email: e.target.value})
                    }
                    required 
                />
                {errors.email && <p className="text-sm text-red-600 mb-3">{errors.email}</p>}

                <div className="w-full flex justify-end gap-3">
                    <PrimaryButton onClick={cancelFunc} className={`${isLoading && "disabled"} bg-gray-200 border-2 border-gray-400 font-bold text-black!`}>Cancel</PrimaryButton>
                    <PrimaryButton className={`${isLoading && "disabled opacity-60"} text-white px-6`} type="submit">
                        {isLoading ? 
                            <span className="flex items-center gap-2">
                                <BiLoaderAlt className="animate-spin text-white" size={20} />
                                "Save"
                            </span>
                        : "Save"}
                    </PrimaryButton>
                </div>
            </form>

        

        </div>
    )
}