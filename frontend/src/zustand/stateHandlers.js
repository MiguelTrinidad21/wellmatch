import { create } from 'zustand';
import { persist, createJSONStorage } from "zustand/middleware";

export const tooltipStore = create((set) => ({
    showTip: false,
    currText: "",
    setShowTip: (value) => set({showTip: value}),
    setCurrText: (value) => set({currText: value})
}))

export const jobInfoStore = create((set) => ({
    displayJob: false,
    isJobSaved: false,
    savedJobIDs: new Set(),
    jobInfo: {
        jobID: null,
        coverPhotoURL: "",
        profilePhotoURL: "",
        jobTitle: "",
        companyName: "",
        location: "",
        workType: "",
        workPlaceOption: "",
        minSalary: "",
        maxSalary: "",
        jobOverview: "",
        jobDuties: "",
        requiredQualifications: "",
        preferredQualifications: "",
        workingConditions: "",
        jobBenefits: "",
    },
    setJobInfo: (value) => set({jobInfo: value}),
    setSavedJobIDs: (value) => set({savedJobIDs: new Set(value)}),
    setDisplayJob: () => set((state) => ({displayJob: !state.displayJob})),
    setIsJobSaved: () => set((state) => ({isJobSaved: !state.isJobSaved}))

}))

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

export const locationStore = create(
    persist(
        (set) => ({
            prevLocation: "",
            setPrevLocation: (value) => set({prevLocation: value})
        }),
        {
            name: "wellmatch-locationLink",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                prevLocation: state.prevLocation
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