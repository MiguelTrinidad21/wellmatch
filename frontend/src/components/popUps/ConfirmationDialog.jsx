import PrimaryButton from "../buttons/PrimaryButton"
import { BiLoaderAlt } from "react-icons/bi";
import Translucent from "../overlay/Translucent";

export default function ConfirmationDialog({ 
    heading, 
    toggleFunction, 
    confirmFunction,
    bodyText,
    buttonText = "Yes"
 }) {
    return (
        <>
            <Translucent />
            <div className="rounded-2xl bg-[#F9FAFB] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 w-75 z-40 ">
                <h1 className="font-bold text-lg mb-2">{heading}</h1>
                <p className="mb-10">{bodyText}</p>

                {/* {error && <p className="text-sm text-red-600">{error}</p>} */}

                <div className="w-full flex justify-end gap-3">
                    <PrimaryButton onClick={toggleFunction} className={` bg-[#F9FAFB] font-bold text-black!`}>Cancel</PrimaryButton>
                    <PrimaryButton className="px-6" onClick={confirmFunction}>
                        {buttonText}
                        {/* {isLoading ? 
                            <span className="flex items-center gap-2">
                                <BiLoaderAlt className="animate-spin text-white" size={20} />
                                Delete
                            </span>
                        : "Delete"} */}
                    </PrimaryButton>
                </div>
            </div>
        </>
    )
}