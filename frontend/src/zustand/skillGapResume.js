import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const resumeStore = create(
    persist(
        (set) => ({
            resumeToAnalyze: null,
            selectedOption: "select",
            selectedYears: "",
            
            setSelectedOption: (value) => set({ selectedOption: value }),
            setSelectedYears: (value) => set({ selectedYears: value }),
            setResumeToAnalyze: (value) => set({ resumeToAnalyze: value }),

            clearResumeToAnalyze: () => set({
                resumeToAnalyze: null,
                selectedOption: "select",
                selectedYears: ""
            })
        }),
        {
            name: "skill-gap-resume-storage",
            storage: createJSONStorage(() => sessionStorage)
        }
    )
);