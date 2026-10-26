import { Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import MarketingLayout from './layouts/MarketingLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './components/dashboard/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import TemplatesPage from './pages/TemplatesPage.jsx';
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
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
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
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
