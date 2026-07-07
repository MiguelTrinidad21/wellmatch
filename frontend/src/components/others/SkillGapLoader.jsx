import { BiLoaderAlt } from "react-icons/bi";

export default function SkillGapLoader() {

    return (
        <div className="w-full h-screen flex justify-center items-center flex-col gap-3">
            <BiLoaderAlt size={40} className="animate-spin" />
            <p className="text-center animate-pulse">Generating report...</p>
        </div>
    )
}