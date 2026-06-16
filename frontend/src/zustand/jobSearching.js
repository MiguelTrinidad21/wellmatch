import { create } from 'zustand';

export const jobSearchStore = create((set) => ({
    jobSearch: {
        jobTitle: "",
        location: ""
    },

    jobSearchResults: [],

    setJobSearch: (value) => set({jobSearch: value}),
    
    setJobSearchResults: (value) => set({jobSearchResults: value}),


}))