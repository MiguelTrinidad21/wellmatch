import ScrollToTop from './ScrollToTop';
import ApplicantSignIn from './pages/applicant/ApplicantSignIn';
import EmployerSignIn from './pages/employer/EmployerSignIn';
import AdminRegister from './pages/admin/AdminRegister';
import ApplicantRegister from './pages/applicant/ApplicantRegister';
import Jobs from './pages/employer/Jobs';
import GuestRoute from './components/others/GuestRoute';
import ProtectedRoute from './components/others/ProtectedRoute';
import ForbiddenAccessPage from './pages/errors/ForbiddenAccessPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import CompanyProfile from './pages/employer/CompanyProfile';
import InviteEmployer from './pages/admin/InviteEmployer';
import EmployerRegister from './pages/employer/EmployerRegister';
import CreateJobPost from './pages/employer/CreateJobPost';
import JobDescription from './pages/employer/JobDescription';
import YearsRequired from './pages/employer/YearsRequired';
import AccountSettings from './pages/employer/AccountSettings';
import RecommendedJobs from './pages/applicant/RecommendedJobs';
import RelatedJobs from './pages/applicant/RelatedJobs';
import ViewJobInfo from './pages/applicant/ViewJobInfo';

import { useEffect } from 'react';
import { userStore } from './zustand/userState';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';

function App() {
  const { currentUser, handleCurrentUser, setAuthChecked } = userStore();

  useEffect(() => {
    async function checkAuth() {
        try {
            const res = await axios.get("/api/auth/me", {
                withCredentials: true
            });

            handleCurrentUser(res.data.user);
        } catch (error) {
            handleCurrentUser(null);
        } finally {
            setAuthChecked(true);            
        }
    }

    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        <Route element={<GuestRoute />}>
          <Route path='/' element={<ApplicantSignIn />}/>
          <Route path='/applicant/login' element={<ApplicantSignIn />}/>
          <Route path='/applicant/register' element={<ApplicantRegister />} />
      
          <Route path='/employer/login' element={<EmployerSignIn />}/>
          <Route path='/employer/register' element={<AdminRegister />} />
          
        </Route>
        
        <Route element={
          <ProtectedRoute allowedUserTypes={["employer", "admin"]} redirectTo={"/employer/login"}/>
        }>    
          <Route path='/employer/jobs' element={<Jobs />} />
          <Route path='/employer/companyProfile' element={<CompanyProfile />} />
          <Route path='/employer/settings' element={<AccountSettings />} />

          <Route path="/employer/createJob" element={<CreateJobPost mode="create" />} />
          <Route path="/employer/createJob/description" element={<JobDescription mode="create" />} />
          <Route path="/employer/createJob/description/years" element={<YearsRequired mode="create" />} />

          <Route path="/employer/jobs/:jobID/edit" element={<CreateJobPost mode="edit" />} />
          <Route path="/employer/jobs/:jobID/edit/description" element={<JobDescription mode="edit" />} />
          <Route path="/employer/jobs/:jobID/edit/description/years" element={<YearsRequired mode="edit" />} />

        </Route>

        <Route element={
          <ProtectedRoute allowedUserTypes={["admin"]} redirectTo={"/employer/login"}/>
        }>
          <Route path='/employer/companyProfile/invite' element={<InviteEmployer />} />
        </Route>

        

        <Route element={
          <ProtectedRoute allowedUserTypes={["applicant"]} redirectTo={"/applicant/login"}/>
        }>
          <Route path='/applicant/home' element={<RecommendedJobs />} />
          <Route path='/applicant/searchJobs' element={<RelatedJobs />} />
          <Route path='/applicant/viewJob/:jobID' element={<ViewJobInfo />} />
        </Route>
        
        <Route path='/employer/register/invite' element={<EmployerRegister />} />        
        <Route path='*' element={<NotFoundPage />}/>
        <Route path='/forbidden' element={<ForbiddenAccessPage />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
