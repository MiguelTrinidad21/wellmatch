import { useState } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { tooltipStore } from "../../zustand/stateHandlers";


export default function Tooltip({ ref, textToCompare, text, className }) {
    const {showTip, setShowTip, currText, setCurrText} = tooltipStore();
    
    return(
        <div className="inline-block">
            <button
                ref={ref}
                type="button"
                onClick={() => {
                    setCurrText(textToCompare)
                    setShowTip(!showTip)
                }}
                className="text-gray-600 hover:text-gray-700 cursor-pointer"
            >
                <IoMdInformationCircleOutline size={20} />
            </button>

            
            <div  className={`pointer-events-none absolute bottom-full left-1/2 z-10 ${className} w-50 rounded-md shadow-md text-white font-medium bg-gray-800 p-2 text-[12px] ${(showTip && currText === text) ? "opacity-100" : " opacity-0"} transition-opacity duration-200 ease-in`}>
                {text}
            </div>
            
        </div>
    )
}