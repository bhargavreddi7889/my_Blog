import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');
  const [redirectMessage, setRedirectMessage] = useState('');
  
  const { login, isAuthenticated, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for redirect message from protected routes
  useEffect(() => {
    if (location.state?.message) {
      setRedirectMessage(location.state.message);
    }
    
    // Check for session expired query param
    if (location.search.includes('session=expired')) {
      setRedirectMessage('Your session has expired. Please login again.');
    }
  }, [location]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // If there's a redirect path, use it
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo);
    }
    // Clear any existing errors when component mounts
    setError(null);
  }, [isAuthenticated, navigate, location, setError]);
  
  const { email, password } = formData;
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    try {
      await login(formData);
      // If successful, the login function in AuthContext will set isAuthenticated to true
      // and the useEffect hook will redirect the user
    } catch (err) {
      // Login error will be handled by AuthContext and displayed via the error state
      console.error('Login submission error:', err);
      if (err.response?.status === 404) {
        setLocalError('Server not found. Please check your connection.');
      } else if (err.response?.status === 401) {
        setLocalError('Invalid email or password.');
      } else if (err.code === 'ECONNABORTED') {
        setLocalError('Request timed out. Please try again.');
      } else if (!err.response && err.message.includes('Network Error')) {
        setLocalError('Network error. Please check your connection.');
      }
      // If no specific error is caught, the error from AuthContext will be shown
    }
  };
  
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-xl shadow-lg mx-auto">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Sign in</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {redirectMessage && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-sm text-yellow-700">{redirectMessage}</p>
          </div>
        )}
        
        {(error || localError) && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-sm text-red-700">{error || localError}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="rounded-md -space-y-px">
            <div className="mb-5">
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={onChange}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={onChange}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 