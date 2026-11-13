import { Navigate, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import MarketingLayout from './layouts/MarketingLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './components/dashboard/ProtectedRoute.jsx';
import AdminRoute from './components/admin/AdminRoute.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminOverview from './pages/admin/Overview.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminPortfolios from './pages/admin/Portfolios.jsx';
import AdminAiBuilder from './pages/admin/AiBuilder.jsx';
import AdminSubscriptions from './pages/admin/Subscriptions.jsx';
import AdminPayments from './pages/admin/Payments.jsx';
import AdminBlog from './pages/admin/Blog.jsx';
import AdminTemplates from './pages/admin/Templates.jsx';
import AdminAnalytics from './pages/admin/Analytics.jsx';
import AdminReports from './pages/admin/Reports.jsx';
import AdminSettings from './pages/admin/Settings.jsx';

import Landing from './pages/Landing.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import TemplatesPage from './pages/TemplatesPage.jsx';
import TemplatePreviewPage from './pages/TemplatePreviewPage.jsx';
import Premium from './pages/Premium.jsx';
import Pricing from './pages/Pricing.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Builder from './pages/Builder.jsx';
import TemplatesWorkspace from './pages/TemplatesWorkspace.jsx';
import StartProject from './pages/StartProject.jsx';
import MyPortfolios from './pages/MyPortfolios.jsx';
import Editor from './pages/Editor.jsx';
import Analyzer from './pages/Analyzer.jsx';
import BlogStudio from './pages/BlogStudio.jsx';
import BlogEditor from './pages/BlogEditor.jsx';
import PublishSuccess from './pages/PublishSuccess.jsx';
import Settings from './pages/Settings.jsx';
import Billing from './pages/Billing.jsx';
import AiProjectBuilder from './pages/AiProjectBuilder.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import PublicPortfolio from './pages/PublicPortfolio.jsx';
import { PublicBlogList, PublicBlogPost } from './pages/PublicBlog.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/:id" element={<TemplatePreviewPage />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/portfolios" element={<AdminPortfolios />} />
            <Route path="/admin/ai-builder" element={<AdminAiBuilder />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/templates" element={<AdminTemplates />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* Public portfolio + blog render on their own, without app chrome. */}
        <Route path="/p/:slug" element={<PublicPortfolio />} />
        <Route path="/p/:slug/blog" element={<PublicBlogList />} />
        <Route path="/p/:slug/blog/:postSlug" element={<PublicBlogPost />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/builder" element={<Builder />} />
            <Route path="/dashboard/create" element={<StartProject />} />
            <Route path="/dashboard/templates" element={<TemplatesWorkspace />} />
            <Route path="/dashboard/portfolios" element={<MyPortfolios />} />
            <Route path="/dashboard/portfolio/:id/edit" element={<Editor />} />
            <Route path="/dashboard/portfolio/:id/analyze" element={<Analyzer />} />
            <Route path="/dashboard/analyzer" element={<Analyzer />} />
            <Route path="/dashboard/blog" element={<BlogStudio />} />
            <Route path="/dashboard/blog/:id" element={<BlogEditor />} />
            <Route path="/dashboard/publish/:id" element={<PublishSuccess />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/billing" element={<Billing />} />
            <Route path="/dashboard/ai-builder" element={<AiProjectBuilder />} />
            <Route path="/dashboard/admin" element={<AdminPanel />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
