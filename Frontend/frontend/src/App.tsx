import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const AdminClaims = lazy(() => import("@/pages/AdminClaims"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const Browse = lazy(() => import("@/pages/Browse"));
const EditItem = lazy(() => import("@/pages/EditItem"));
const Home = lazy(() => import("@/pages/Home"));
const ItemDetail = lazy(() => import("@/pages/ItemDetail"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Profile = lazy(() => import("@/pages/Profile"));
const ReportForm = lazy(() => import("@/pages/ReportForm"));

function LostReport() {
  return <ReportForm reportType="lost" />;
}

function FoundReport() {
  return <ReportForm reportType="found" />;
}

function LoginPage() {
  return <AuthPage mode="login" />;
}

function RegisterPage() {
  return <AuthPage mode="register" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/browse" component={Browse} />
      <Route path="/report/lost" component={LostReport} />
      <Route path="/report/found" component={FoundReport} />
      <Route path="/items/:id/edit" component={EditItem} />
      <Route path="/items/:id" component={ItemDetail} />
      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/claims" component={AdminClaims} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-[#03080e] text-sm font-semibold text-cyan-200">
                Loading Lost and Found…
              </div>
            }
          >
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
