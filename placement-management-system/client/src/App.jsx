import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import { Loading } from "./components/ui.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import DriveDetail from "./pages/DriveDetail.jsx";
import StudentDrives from "./pages/student/Drives.jsx";
import StudentApplications from "./pages/student/Applications.jsx";
import StudentResume from "./pages/student/Resume.jsx";
import CompanyDrives from "./pages/company/Drives.jsx";
import CompanyApplicants from "./pages/company/Applicants.jsx";
import AdminCompanies from "./pages/admin/Companies.jsx";
import AdminStudents from "./pages/admin/Students.jsx";
import AdminDrives from "./pages/admin/Drives.jsx";
import AdminReports from "./pages/admin/Reports.jsx";

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to="/" replace /> : children;
}

// Same URL, different screen for each role
function ByRole(props) {
  const { user } = useAuth();
  return props[user.role] || null;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Guest><Login /></Guest>} />
      <Route path="/register" element={<Guest><Register /></Guest>} />

      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="drives" element={<ByRole student={<StudentDrives />} company={<CompanyDrives />} admin={<AdminDrives />} />} />
        <Route path="drives/:id" element={<DriveDetail />} />
        <Route path="profile" element={<Profile />} />

        <Route path="applications" element={<Protected roles={["student"]}><StudentApplications /></Protected>} />
        <Route path="resume" element={<Protected roles={["student"]}><StudentResume /></Protected>} />

        <Route path="applicants" element={<Protected roles={["company"]}><CompanyApplicants /></Protected>} />

        <Route path="companies" element={<Protected roles={["admin"]}><AdminCompanies /></Protected>} />
        <Route path="students" element={<Protected roles={["admin"]}><AdminStudents /></Protected>} />
        <Route path="reports" element={<Protected roles={["admin"]}><AdminReports /></Protected>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
