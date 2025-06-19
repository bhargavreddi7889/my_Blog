import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BlogDetail from './pages/BlogDetail';
import CreateBlog from './pages/CreateBlog';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Blogs from './pages/Blogs';

// Components
import Layout from './components/Layout';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/blogs/:id" element={<Layout><BlogDetail /></Layout>} />
          
          {/* Protected routes */}
          <Route 
            path="/blogs" 
            element={
              <ProtectedRoute>
                <Layout><Blogs /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/blogs/create" 
            element={
              <ProtectedRoute>
                <Layout><CreateBlog /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/blogs/edit/:id" 
            element={
              <ProtectedRoute>
                <Layout><CreateBlog /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:id" 
            element={<Layout><Profile /></Layout>} 
          />
          
          {/* 404 route */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
        
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
