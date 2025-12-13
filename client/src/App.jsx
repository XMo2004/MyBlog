import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { Home } from './pages/Home';
import { PostDetail } from './pages/PostDetail';
import { Categories } from './pages/Categories';
import { Tags } from './pages/Tags';
import { Columns } from './pages/Columns';
import { ColumnDetail } from './pages/ColumnDetail';
import { Resources } from './pages/Resources';

import { Projects } from './pages/Projects';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserProfile } from './pages/UserProfile';
import { Dashboard } from './pages/Admin/Dashboard';
import { Posts } from './pages/Admin/Posts';
import AdminSettings from './pages/Admin/Settings';
import AdminProfile from './pages/Admin/Profile';
import AdminProjects from './pages/Admin/Projects';
import AdminResources from './pages/Admin/Resources';
import AdminColumns from './pages/Admin/Columns';
import AdminColumnStructure from './pages/Admin/ColumnStructure';
import AdminTools from './pages/Admin/Tools';
import Admins from './pages/Admin/Admins';
import AdminUsers from './pages/Admin/Users';
import AdminWeight from './pages/Admin/Weight';
import Weight from './pages/Weight';

import { ProtectedRoute } from './components/ProtectedRoute';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { visitApi } from './lib/api';

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
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/columns" element={<Columns />} />
          <Route path="/columns/:id" element={<ColumnDetail />} />
          <Route path="/resources" element={<Resources />} />

          <Route path="/projects" element={<Projects />} />
          <Route path="/weight" element={<Weight />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
        </Route>
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
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

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
