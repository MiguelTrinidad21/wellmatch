import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const resumeStore = create(
    persist(
        (set) => ({
            resumeToAnalyze: null,
            selectedOption: "select",

            setSelectedOption: (value) => set({ selectedOption: value }),
            setResumeToAnalyze: (value) => set({ resumeToAnalyze: value }),

            clearResumeToAnalyze: () => set({
                resumeToAnalyze: null,
                selectedOption: "select"
            })
        }),
        {
            name: "skill-gap-resume-storage",
            storage: createJSONStorage(() => sessionStorage)
        }
    )
);