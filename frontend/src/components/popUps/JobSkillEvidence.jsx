import { IoClose } from "react-icons/io5";
import Translucent from "../overlay/Translucent";

export default function JobSkillEvidence({
    resumeSkill,
    resumeEvidence,
    jobSkill,
    jobEvidence,
    toggleFunc,
    status
}) {
    const isMatched = status === "matched";

    return (
        <>
            <Translucent />
            <div className={`fixed left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[90%] z-40 bg-slate-100 rounded-xl shadow-xl md:w-90`}>
                <div className="w-full relative p-4 pt-5">
                    <IoClose size={20} onClick={toggleFunc} className="absolute top-1 right-3 md:top-3" />

                    <h1 className={`font-bold text-sm ${isMatched ? "text-green-700" : "text-red-700"} mb-2`}>JOB REQUIREMENT</h1>
                    <div className={`${isMatched ? "bg-[#E4F3E8]" : "bg-red-50"} flex gap-2 items-center p-1 px-2 rounded-lg w-fit mb-4`}>
                        <div className={`${isMatched ? "bg-green-500" : "bg-red-600"} h-2 w-2 rounded-full`}></div>
                        <p className={`font-semibold ${isMatched ? "text-green-800" : "text-red-800"}  text-sm`}>{jobSkill}</p>
                    </div>
                    <h1 className={`font-bold ${isMatched ? "text-green-700" : "text-red-700"} text-sm mb-2`}>EVIDENCE FROM JOB POST</h1>
                    <div className={`border-l-3 ${isMatched ? "border-l-green-600" : "border-l-red-600"} pl-4 py-2 `}>
                        <p className="text-sm">{jobEvidence}</p>
                    </div>

                    {isMatched &&
                        <>
                            <div className="relative flex py-5 items-center">
                                <div className="grow border-t border-gray-300"></div>
                                <span className="shrink mx-4 text-gray-500 text-sm">MATCHED WITH</span>
                                <div className="grow border-t border-gray-300"></div>
                            </div>
                            
                            <h1 className="font-bold text-sm text-[#073789] mb-2">RESUME SKILL</h1>
                            <div className="bg-[#E0F0FE] flex gap-2 items-center p-1 px-2 rounded-lg w-fit mb-4">
                                <div className="bg-blue-500 h-2 w-2 rounded-full"></div>
                                <p className="font-semibold text-[#073789]  text-sm">{resumeSkill}</p>
                            </div>
                            <h1 className="font-bold text-[#073789] text-sm mb-2">EVIDENCE</h1>
                            <div className="border-l-3 border-l-blue-500 pl-4 py-2 ">
                                <p className="text-sm">{resumeEvidence}</p>
                            </div>                    
                        </>
                    }
                    {/* <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-slate-100 rotate-45"></div> */}
                </div>
            </div>
        
        </>
    )
}