import AuthNavBar from "../../components/navBars/AuthNavBar";
import Overlay from "../../components/overlay/OverlayMobile";
import Footer from "../../components/others/Footer";
import PrimaryButton from "../../components/buttons/PrimaryButton";

export default function AccountSettings() {

    return (
        <>
            <div className="w-full px-6 min-h-screen bg-[#F9FAFB]">
                <AuthNavBar />
                <Overlay />

                <h1 className="font-bold text-2xl text-center my-6">Account Settings</h1>

                <div>
                    
                </div>

            </div>

            <Footer />
        </>
    )
}