import { create } from 'zustand';


export const applicantVerifyCodeStore = create((set) => ({
    applicantEmail: "",
    setApplicantEmail: (value) => set({applicantEmail: value})    
}));



export const employerVerifyCodeStore = create((set) => ({
    employerEmail: "",
    coEmployerToken: "",
    setEmployerEmail: (value) => set({employerEmail: value}),  
    setEmployerToken: (value) => set({coEmployerToken: value})  
}));



