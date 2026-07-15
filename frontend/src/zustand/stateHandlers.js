import { create } from 'zustand';
import { persist, createJSONStorage } from "zustand/middleware";

export const sideBarStore = create(
    persist(
        (set) => ({
            sideBarStatus: false,
            applicantActiveLink: "Home",
            employerActiveLink: "Jobs",
            toggleSideBar: () => set((state) => ({sideBarStatus: !state.sideBarStatus})),
            setApplicantActiveLink: (value) => set({applicantActiveLink: value}),
            setEmployerActiveLink: (value) => set({employerActiveLink: value})
        }),
        {
            name: "wellmatch-sideBar",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                applicantActiveLink: state.applicantActiveLink,
                employerActiveLink: state.employerActiveLink,
            })            
        }
));


export const companyStore = create((set) => ({
    companyInfo: {},
    setCompanyInfo: (value) => set({companyInfo: value})
}))

export const jobCreationStore = create(
    persist(
        (set) => ({
            createdJob: {
                jobTitle: "",
                location: "",
                workplaceOption: "",
                workType: "",
                payRangeFrom: "",
                payRangeTo: "",
                jobOverview: "",
                jobDuties: "",
                requiredQualifications: "",
                preferredQualifications: "",
                workingConditions: "",
                jobBenefits: "",
                yearsRequired: "0"
            },

            setCreatedJob: (newData) =>
                set((state) => ({
                    createdJob: {
                        ...state.createdJob,
                        ...newData
                    }
                })),

            clearCreatedJob: () =>
                set({
                    createdJob: {
                        jobTitle: "",
                        location: "",
                        workplaceOption: "",
                        workType: "",
                        payRangeFrom: "",
                        payRangeTo: "",
                        jobOverview: "",
                        jobDuties: "",
                        requiredQualifications: "",
                        preferredQualifications: "",
                        workingConditions: "",
                        jobBenefits: "",
                        yearsRequired: "0",
                    },
                }),
        }),
        {
            name: "wellmatch-job-creation",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                createdJob: state.createdJob,
            }),
        }
    )
);