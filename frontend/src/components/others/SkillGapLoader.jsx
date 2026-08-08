import { BiLoaderAlt } from "react-icons/bi";
import { RiSparkling2Line } from "react-icons/ri";

export default function SkillGapLoader() {

    return (
        <div className="w-full h-screen flex justify-center items-center flex-col gap-3">
            <BiLoaderAlt size={40} className="animate-spin" />
            <p className="text-center animate-pulse flex items-center">
                <RiSparkling2Line size={20} />&nbsp;
                Generating report...
            </p>
        </div>
    )
}