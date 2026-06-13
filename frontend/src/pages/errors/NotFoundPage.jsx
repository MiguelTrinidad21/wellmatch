import PrimaryButton from "../../components/buttons/PrimaryButton"

export default function NotFoundPage() {

    return (
        <div className="w-full text-center min-h-screen flex items-center flex-col">
            <h1 className="text-6xl font-bold text-green-600 mt-10">404</h1>

            <h2 className="mt-4 text-2xl font-semibold text-gray-800">
                Page Not Found
            </h2>

            <p className="mt-3 text-gray-600">
                The page you are looking for does not exist.
            </p>

            <PrimaryButton className="mt-4" to="/">Go back home</PrimaryButton>
        </div>
    )
}