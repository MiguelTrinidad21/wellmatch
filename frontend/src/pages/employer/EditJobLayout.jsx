import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { jobCreationStore } from "../../zustand/stateHandlers";
import { BiLoaderAlt } from "react-icons/bi";
import api from "../../apis/axios";

export default function EditJobLayout() {
    const { jobID } = useParams();
    const navigate = useNavigate();

    const { setCreatedJob, loadedJobId, setLoadedJobId } = jobCreationStore();


    const [isLoading, setIsLoading] = useState(loadedJobId !== jobID);

    useEffect(() => {

        if (loadedJobId === jobID) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        async function fetchJobForEdit() {
            setIsLoading(true);

            try {
                const response = await api.get(`/employer/jobs/${jobID}`);
                if (cancelled) return;

                const job = response.data.jobToEdit;

                setCreatedJob({
                    jobTitle: job.jobTitle,
                    location: job.location,
                    workplaceOption: job.workPlaceOption,
                    workType: job.workType,
                    payRangeFrom: job.minSalary,
                    payRangeTo: job.maxSalary,
                    jobOverview: job.jobOverview,
                    jobDuties: job.jobDuties,
                    requiredQualifications: job.requiredQualifications || "",
                    preferredQualifications: job.preferredQualifications || "",
                    workingConditions: job.workingConditions || "",
                    jobBenefits: job.jobBenefits || "",
                    yearsRequired: String(job.requiredYearsExp)
                });

                setLoadedJobId(jobID);
            } catch (error) {
                console.error(error);
                if (!cancelled) navigate("/forbidden");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchJobForEdit();

        return () => {
            cancelled = true;
        };


    }, [jobID]);

    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#F3F4F6]">
                <BiLoaderAlt className="animate-spin text-3xl text-green-600" />
            </div>
        );
    }

    return <Outlet />;
}