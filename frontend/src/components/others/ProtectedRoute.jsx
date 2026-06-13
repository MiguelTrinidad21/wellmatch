import { Navigate, Outlet } from "react-router-dom";
import { userStore } from "../../zustand/userState";
import Loading from "./Loading";

export default function ProtectedRoute({ allowedUserTypes, redirectTo }) {
    const { currentUser, authChecked } = userStore();

    if (!authChecked) {
        return <Loading />;
    }

    if (!currentUser) {
        return <Navigate to={redirectTo} replace />;
    }

    if (!allowedUserTypes.includes(currentUser.userType)) {
        return <Navigate to="/forbidden" replace />;
    }

    return <Outlet />;
}