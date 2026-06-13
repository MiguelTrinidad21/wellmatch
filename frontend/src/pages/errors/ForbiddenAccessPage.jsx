import PrimaryButton from "../../components/buttons/PrimaryButton";


export default function ForbiddenAccessPage() {
    return(
        <div className="w-full text-center min-h-screen flex items-center flex-col">
            <h1 className="text-3xl font-bold text-red-600 mt-10">Access Denied</h1>
            <p className="mt-5">You don't have permission to view this page.</p>
            <PrimaryButton className="mt-5 text-black! bg-gray-300" to="/">Return to Home</PrimaryButton>
        </div>
    )
}