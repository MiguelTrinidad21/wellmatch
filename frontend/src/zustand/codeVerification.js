import { create } from 'zustand';
import { persist, createJSONStorage } from "zustand/middleware";


export const applicantVerifyCodeStore = create(
    persist(
        (set) => ({
            applicantEmail: "",
            setApplicantEmail: (value) => set({applicantEmail: value})
        }),
        {
            name: "applicant-codeVerification",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                applicantEmail: state.applicantEmail
            })            
        }
    )
);


export const employerVerifyCodeStore = create(
    persist(
        (set) => ({
            employerEmail: "",
            setEmployerEmail: (value) => set({employerEmail: value})
        }),
        {
            name: "employer-codeVerification",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                employerEmail: state.employerEmail
            })            
        }
    )
);


