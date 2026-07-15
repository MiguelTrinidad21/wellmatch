import { Link, useLocation } from 'react-router-dom';
import webLogo from '../../assets/WellMatch_Logo.png'
import SecondaryButton from '../buttons/SecondaryButton';

export default function PublicNavBar() {
    const { pathname } = useLocation();

    const isEmployerSite = pathname.startsWith("/employer");
    const isRegisterPage =
        pathname.includes("/register") || pathname.includes("/invite");

    const switchSiteLabel = isEmployerSite ? "Applicant Site" : "Employer Site";
    const switchSiteLink = isEmployerSite
        ? "/applicant/login"
        : "/employer/login";

    const buttonLabel = isRegisterPage ? "Sign in" : "Register";
    const buttonLink = isRegisterPage
        ? isEmployerSite
        ? "/employer/login"
        : "/applicant/login"
        : isEmployerSite
        ? "/employer/register"
        : "/applicant/register";

    const logoLink = isEmployerSite ? "/employer/login" : "/applicant/login";

    return (
        <nav className="fixed left-0 top-0 z-20 flex h-16 w-full items-center justify-between bg-white pr-5 pl-4 shadow-sm md:pr-15 md:pl-14 md:h-18 lg:h-20 lg:pl-19 lg:pr-20 xl:pl-29 xl:pr-30 ">
            <Link to={logoLink}>
                <img
                className="h-9 w-auto object-contain md:h-12 lg:h-15 "
                src={webLogo}
                alt="WellMatch Logo"
                />
            </Link>

            <div className="flex items-center gap-4 md:gap-10 lg:gap-12">
                <Link
                to={switchSiteLink}
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors duration-300 md:text-[16px] lg:text-lg lg:font-semibold"
                >
                {switchSiteLabel}
                </Link>

                <SecondaryButton className="md:text-[16px]! lg:text-lg! lg:px-6 lg:border-3 lg:font-semibold" to={buttonLink}>
                {buttonLabel}
                </SecondaryButton>
            </div>
        </nav>
    );
}