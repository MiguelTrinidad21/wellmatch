import PrimaryButton from "../buttons/PrimaryButton"
import Translucent from "../overlay/Translucent"

export default function ErrorBox({ heading = "Error!", text, onClick, buttonText = "Close" }) {
    return (
        <>
            <Translucent />
            <div className="rounded-2xl bg-[#F9FAFB] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 w-75 z-40 flex justify-center flex-col">
                <h1 className="font-bold text-lg text-center mb-5 text-red-600">{heading}</h1>
                <p className="mb-4 text-center">{text}</p>
                <PrimaryButton className="bg-red-600" onClick={onClick}>{buttonText}</PrimaryButton>
            </div>

        </>
    )
}