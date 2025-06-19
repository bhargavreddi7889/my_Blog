import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import BlogList from '../components/BlogList';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // Parent will handle rendering fallback UI
    }

    return this.props.children;
  }
}

const Blogs = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const [blogListError, setBlogListError] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const navigate = useNavigate();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setSessionTimeout(true);
    }
  }, [isAuthenticated, loading]);
  
  // Error boundary for BlogList
  const handleBlogListError = (error) => {
    console.error('BlogList error:', error);
    setBlogListError(true);
  };
  
  // Handle session timeout
  if (sessionTimeout) {
    return (
      <div className="max-w-7xl mx-auto py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Timeout</h2>
          <p className="text-gray-600 mb-6">
            Your session has expired or you need to sign in to view blogs.
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Latest Blog Posts</h1>
          <Link to="/blogs/create" className="px-4 py-2 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Write a Blog
          </Link>
        </div>
        
        {/* Display BlogList component with error handling */}
        {blogListError ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700">
              Unable to load blogs at this time. Please try again later or create a new blog post.
            </p>
          </div>
        ) : (
          <ErrorBoundary onError={handleBlogListError}>
            <BlogList />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};

export default Blogs; 