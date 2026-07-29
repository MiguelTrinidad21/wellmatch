import { create } from 'zustand';
import { persist, createJSONStorage } from "zustand/middleware";

export const jobSearchStore = create(
    persist(
        (set) => ({
            jobSearch: {
                jobTitle: "",
                location: ""
            },
        
            jobSearchResults: [],
        
            setJobSearch: (value) => set({jobSearch: value}),
            
            setJobSearchResults: (value) => set({jobSearchResults: value}),
        }),
        {
            name: "wellmatch-jobSearching",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                jobSearch: state.jobSearch,
                jobSearchResults: state.jobSearchResults
            })
        }
    )
)