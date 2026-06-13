import PrimaryButton from "../buttons/PrimaryButton"

export default function ConfirmationBox({ text, onClick, buttonText }) {
    return (
        <div className="rounded-2xl bg-[#F9FAFB] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 w-75 z-40 flex justify-center flex-col">
            <p className="mb-4 text-center">{text}</p>
            <PrimaryButton onClick={onClick}>{buttonText}</PrimaryButton>
        </div>
    )
}