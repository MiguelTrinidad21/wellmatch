import PublicNavBar from "../../components/navBars/PublicNavBar";
import Footer from "../../components/others/Footer";
import ConfirmationBox from "../../components/popUps/ConfirmationBox";
import Translucent from "../../components/overlay/Translucent";
import Overlay from "../../components/overlay/OverlayMobile";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import api from "../../apis/axios";
import { applicantVerifyCodeStore, employerVerifyCodeStore } from "../../zustand/codeVerification";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BiLoaderAlt } from "react-icons/bi";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifySignUpEmail({ user }) {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const navigate = useNavigate();
    const { applicantEmail } = applicantVerifyCodeStore();
    const { employerEmail } = employerVerifyCodeStore();
    const isApplicant = user === "applicant";
    const currentEmail = isApplicant ? applicantEmail : employerEmail;

    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPopUp, setShowPopUp] = useState(false);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

    const intervalRef = useRef(null);

    // Countdown ticks every second. Re-runs only when `cooldown` is reset
    // back to the full value (i.e. right after a successful resend).
    useEffect(() => {
        if (cooldown <= 0) return;

        intervalRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [cooldown === RESEND_COOLDOWN_SECONDS]);

    useEffect(() => {
        if (isApplicant) {
            if (!applicantEmail) {
                navigate("/applicant/register");
            }
        } else if (user === "employer") {
            if (!employerEmail) {
                navigate("/employer/register");
            }
        } else {
            if (!employerEmail) {
                navigate(`/employer/register/invite?token=${token}`)
            }
        }
    }, []);

    function closePopUp() {
        setShowPopUp(false);

        if (isApplicant) {
            navigate("/applicant/login");
        } else {
            navigate("/employer/login");
        }
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!code || code.trim().length !== 6) {
            setErrors({ invalid: "Enter the 6-digit code" });
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            if (isApplicant) {
                await api.post("/applicant/emailSignUp/verify", { code, applicantEmail });

            } else if (user === "employer") {
                await api.post("/employer/emailSignUp/verify", { code, employerEmail });

            } else {
                await api.post(`/employer/emailSignUp/${token}/verify`, { code, employerEmail })
            }

            setShowPopUp(true);

        } catch (error) {
            console.log(error);

            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";

            if (issue) {
                setErrors({ [issue]: message });
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            }

        } finally {
            setIsLoading(false);
        }
    }

    async function resendCode() {
        if (cooldown > 0 || isResending) return;

        setIsResending(true);
        setErrors({});

        try {
            if (isApplicant) {
                await api.post("/applicant/emailSignUp/resendCode", { applicantEmail });
            } else {
                await api.post("/employer/emailSignUp/resendCode", { employerEmail });
            }

            setCode("");
            setCooldown(RESEND_COOLDOWN_SECONDS);

        } catch (error) {
            console.log(error);

            const issue = error.response?.data?.issue;
            const message = error.response?.data?.message || "An error occurred";
            const secondsRemaining = error.response?.data?.secondsRemaining;

            if (issue) {
                setErrors({ [issue]: message });

                if (issue === "cooldown" && typeof secondsRemaining === "number") {
                    setCooldown(secondsRemaining);
                }
            } else {
                setErrors({ general: "Unable to connect to the server. Please try again." });
            }

        } finally {
            setIsResending(false);
        }
    }

    const resendDisabled = cooldown > 0 || isResending || isLoading;

    return (
        <main className="w-full min-h-screen bg-[#F3F4F6] relative p-6 md:p-15">
            <PublicNavBar />
            <Overlay />

            {showPopUp && (
                <>
                    <Translucent />
                    <ConfirmationBox onClick={closePopUp} buttonText="Sign in" text="Account registered successfully" />
                </>
            )}

            <div className="m-auto w-full md:w-100 lg:w-150">
                <h1 className="text-2xl font-bold mb-2">Enter the confirmation code</h1>
                <p className="text-gray-800 font-medium mb-5">
                    To confirm your account, enter the 6-digit code we sent to&nbsp;
                    <span className="font-bold wrap-break-word">{currentEmail}</span>
                </p>

                <form onSubmit={handleSubmit} className="w-full">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Confirmation code"
                        autoComplete="off"
                        inputMode="numeric"
                        minLength={1}
                        maxLength={6}
                        className={`p-2 rounded-lg block w-full border-2 border-gray-300 mb-4 bg-[#F9FAFB] outline-none transition-colors duration-200 ease-in-out focus:border-green-600 ${
                            errors.invalid ? "border-red-600 focus:border-red-600 mb-1!" : "border-gray-300"
                        }`}
                    />
                    {errors.invalid && <p className="text-red-600 text-[13px] mb-4">{errors.invalid}</p>}
                    {errors.general && <p className="text-red-600 text-[13px] mb-4">{errors.general}</p>}

                    <PrimaryButton disabled={isLoading} type="submit" className={`w-full mb-2 ${isLoading ? "opacity-60 cursor-progress" : undefined}`}>
                        {isLoading ?
                            <span className="flex items-center justify-center gap-2">
                                <BiLoaderAlt size={20} className="animate-spin" />
                                Submit
                            </span>
                        : "Submit"
                        }
                    </PrimaryButton>

                </form>

                <PrimaryButton
                    disabled={resendDisabled}
                    onClick={resendCode}
                    className={`w-full bg-slate-200 text-gray-600! font-medium! mb-1 ${resendDisabled ? "opacity-60 cursor-not-allowed" : undefined}`}
                >
                    {isResending ?
                        <span className="flex items-center justify-center gap-2">
                            <BiLoaderAlt size={18} className="animate-spin" />
                            Resend Code
                        </span>
                    : "Resend Code"
                    }
                </PrimaryButton>

                <p className="text-gray-500 text-[13px] text-center mb-4">
                    {cooldown > 0
                        ? `You can request a new code in ${formatTime(cooldown)}`
                        : "You can now request a new code"}
                </p>

                {errors.cooldown && <p className="text-red-600 text-[13px] mb-4 text-center">{errors.cooldown}</p>}
                {errors.notFound && <p className="text-red-600 text-[13px] mb-4 text-center">{errors.notFound}</p>}
            </div>
        </main>
    )
}