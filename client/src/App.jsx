import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { visitApi } from './lib/api';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';

const Weight = React.lazy(() => import('./pages/Weight'));
const Home = React.lazy(() => import('./pages/Home'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));
const Categories = React.lazy(() => import('./pages/Categories'));
const Tags = React.lazy(() => import('./pages/Tags'));
const Columns = React.lazy(() => import('./pages/Columns'));
const ColumnDetail = React.lazy(() => import('./pages/ColumnDetail'));
const Resources = React.lazy(() => import('./pages/Resources'));
const Projects = React.lazy(() => import('./pages/Projects'));
const Memories = React.lazy(() => import('./pages/Memories'));
const About = React.lazy(() => import('./pages/About'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const MathTest = React.lazy(() => import('./pages/MathTest'));
const Dashboard = React.lazy(() => import('./pages/Admin/Dashboard'));
const Posts = React.lazy(() => import('./pages/Admin/Posts'));
const AdminSettings = React.lazy(() => import('./pages/Admin/Settings'));
const AdminProfile = React.lazy(() => import('./pages/Admin/Profile'));
const AdminProjects = React.lazy(() => import('./pages/Admin/Projects'));
const AdminResources = React.lazy(() => import('./pages/Admin/Resources'));
const AdminColumns = React.lazy(() => import('./pages/Admin/Columns'));
const AdminColumnStructure = React.lazy(() => import('./pages/Admin/ColumnStructure'));
const AdminTools = React.lazy(() => import('./pages/Admin/Tools'));
const Admins = React.lazy(() => import('./pages/Admin/Admins'));
const AdminUsers = React.lazy(() => import('./pages/Admin/Users'));
const AdminWeight = React.lazy(() => import('./pages/Admin/Weight'));
const AdminComments = React.lazy(() => import('./pages/Admin/Comments'));
const AdminAnalytics = React.lazy(() => import('./pages/Admin/Analytics'));
const AdminCategories = React.lazy(() => import('./pages/Admin/Categories'));
const AdminMemories = React.lazy(() => import('./pages/Admin/Memories'));

const VisitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Only track public routes
    if (!location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/login')) {
      visitApi.record({ path: location.pathname });
    }
  }, [location]);

  return null;
};

function App() {
  return (
    <Router>
      <VisitTracker />
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/columns" element={<Columns />} />
            <Route path="/columns/:id" element={<ColumnDetail />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/weight" element={<Weight />} />
            <Route path="/about" element={<About />} />
            <Route path="/math-test" element={<MathTest />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="posts" element={<Posts />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="resources" element={<AdminResources />} />
            <Route path="columns" element={<AdminColumns />} />
            <Route path="columns/:id/structure" element={<AdminColumnStructure />} />
            <Route path="tools" element={<AdminTools />} />
            <Route path="admins" element={<Admins />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="weight" element={<AdminWeight />} />
            <Route path="comments" element={<AdminComments />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="memories" element={<AdminMemories />} />
          </Route>
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
