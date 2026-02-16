import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CookieBanner } from "./components/CookieBanner";

// Pages
import Home from "./pages/Home";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import Kontakt from "./pages/Kontakt";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AcceptInvitation from "./pages/AcceptInvitation";
import ChangePassword from "./pages/ChangePassword";

// User Pages
import UserDashboard from "./pages/user/Dashboard";
import CourseView from "./pages/user/CourseView";
import TopicView from "./pages/user/TopicView";
import QuizView from "./pages/user/QuizView";
import ExamView from "./pages/user/ExamView";
import CertificateView from "./pages/user/CertificateView";
import Certificates from "./pages/user/Certificates";

// Company Admin Pages
import CompanyDashboard from "./pages/company/Dashboard";
import EmployeeList from "./pages/company/EmployeeList";
import EmployeeInvite from "./pages/company/EmployeeInvite";
import CSVImport from "./pages/company/CSVImport";

// SysAdmin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import CompanyList from "./pages/admin/CompanyList";
import CompanyCreate from "./pages/admin/CompanyCreate";
import CompanyEdit from "./pages/admin/CompanyEdit";
import CourseList from "./pages/admin/CourseList";
import CourseEditor from "./pages/admin/CourseEditor";
import SecurityLogs from "./pages/admin/SecurityLogs";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/impressum" component={Impressum} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/kontakt" component={Kontakt} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/invite/:token" component={AcceptInvitation} />
      <Route path="/change-password" component={ChangePassword} />
      
      {/* User Routes */}
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/course/:id" component={CourseView} />
      <Route path="/course/:id/quiz" component={QuizView} />
      <Route path="/course/:courseId/topic/:topicId" component={TopicView} />
      <Route path="/course/:id/exam" component={ExamView} />
      <Route path="/course/:id/certificate" component={CertificateView} />
      <Route path="/certificates" component={Certificates} />
      
      {/* Company Admin Routes */}
      <Route path="/company" component={CompanyDashboard} />
      <Route path="/company/employees" component={EmployeeList} />
      <Route path="/company/employees/invite" component={EmployeeInvite} />
      <Route path="/company/employees/import" component={CSVImport} />
      
      {/* SysAdmin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/companies" component={CompanyList} />
      <Route path="/admin/companies/new" component={CompanyCreate} />
      <Route path="/admin/companies/:id" component={CompanyEdit} />
      <Route path="/admin/courses" component={CourseList} />
      <Route path="/admin/courses/new" component={CourseEditor} />      <Route path="/admin/kurse/:id/edit" component={CourseEditor} />
      <Route path="/admin/security-logs" component={SecurityLogs} />     
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
