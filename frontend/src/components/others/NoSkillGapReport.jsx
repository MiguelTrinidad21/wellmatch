import { FiAlertTriangle } from "react-icons/fi";

export default function NoSkillGapReport() {
    

    return (
        <div className="w-full h-screen bg-[#F3F4F6] flex justify-center items-center flex-col gap-3">
            <div className="w-65 lg:w-80 bg-white flex flex-col items-center rounded-2xl shadow-sm p-5">
                <div className="bg-red-100 mb-8 min-w-0 shrink-0 p-1 w-11 h-11 lg:w-15 lg:h-15 rounded-xl flex justify-center items-center">
                    <FiAlertTriangle size={25} className="text-red-700"/>
                </div>                
                
                <div>
                    <h1 className="text-lg font-bold text-center mb-2 lg:text-xl">AI Report Unavailable</h1>
                    <p className="text-sm lg:text-[1rem] text-center mb-5">This applicant has deleted their account, so their skill gap report can no longer be generated.</p>
                </div>
            </div>
        </div>
    )

}