import { BiLoaderAlt } from "react-icons/bi";

export default function Loading() {

    return (
        <div className="w-full h-screen flex justify-center items-center flex-col">
            <BiLoaderAlt size={30} className="animate-spin" />
            <p className="text-center">Loading interface...</p>
        </div>
    )
}