import PrimaryButton from "../buttons/PrimaryButton"
import Translucent from "../overlay/Translucent"

export default function ConfirmationBox({ text, onClick, buttonText = "Close" }) {
    return (
        <>
            <Translucent />
            <div className="rounded-2xl bg-[#F9FAFB] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 w-70 z-40 flex justify-center flex-col">
                <p className="mb-8 text-center md:mb-10 md:text-lg">{text}</p>
                <PrimaryButton onClick={onClick}>{buttonText}</PrimaryButton>
            </div>

        </>
    )
}