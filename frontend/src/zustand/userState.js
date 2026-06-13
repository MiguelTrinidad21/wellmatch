import { create } from "zustand";

export const userStore = create((set) => ({
    currentUser: null,
    authChecked: false,

    handleCurrentUser: (user) => set({currentUser: user}),

    setAuthChecked: (value) => set({authChecked: value}),

    logoutUser: () => set({currentUser: null})

}));