import { useState } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";
<IoMdInformationCircleOutline />
export default function Tooltip({ text }) {
    const [showTip, setShowTip] = useState(false);
    
    return(
        <div className="inline-block">
            <button
                type="button"
                onClick={() => setShowTip(!showTip)}
                className="text-gray-500 hover:text-gray-700"
            >
                <IoMdInformationCircleOutline size={20} />
            </button>

            {showTip && (
                <div  className={`absolute bottom-[90%] -right-7.5 z-10 w-40 rounded-md shadow-md text-white font-semibold bg-[#10B981] p-2 text-[12px]`}>
                    {text}
                </div>
            )}
        </div>
    )
}