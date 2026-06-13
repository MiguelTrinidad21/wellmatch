import { Navigate, Outlet } from "react-router-dom";
import { userStore } from "../../zustand/userState.js";

export default function GuestRoute() {
    const { currentUser, authChecked } = userStore();

    if (!authChecked) {
        return <p>Checking account...</p>;
    }

    if (
        currentUser?.userType === "applicant") {
        return <Navigate to="/applicant/jobs" replace />;
    }

    if (currentUser?.userType === "employer" ||
        currentUser?.userType === "admin"
    ) {
        return <Navigate to="/employer/jobs" replace />;
    }

    return <Outlet />;
}