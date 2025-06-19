import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaPen, FaSearch, FaBell } from 'react-icons/fa';
import { getImageUrl, getInitials } from '../../utils/api';

const Header = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-indigo-600';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="font-heading text-2xl font-bold text-indigo-600 flex items-center">
          <span className="text-indigo-500">Blog</span>
          <span className="text-indigo-700">Verse</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className={`${isActive('/')} font-ui transition-colors duration-200`}>Home</Link>
          <Link to="/blogs" className={`${isActive('/blogs')} font-ui transition-colors duration-200`}>Explore</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/blogs/create" className="font-ui text-gray-700 hover:text-indigo-600 transition-colors duration-200 flex items-center">
                <FaPen className="mr-1.5" /> Write
              </Link>
              
              <button 
                onClick={toggleSearch}
                className="text-gray-500 hover:text-indigo-600 transition-colors duration-200"
              >
                <FaSearch size={18} />
              </button>
              
              <div className="relative">
                <button className="text-gray-500 hover:text-indigo-600 transition-colors duration-200">
                  <FaBell size={18} />
                </button>
              </div>
              
              <div className="relative group">
                <button className="flex items-center group-hover:text-indigo-600 transition-colors duration-200">
                  <img 
                    src={getImageUrl(user?.avatar) || `https://ui-avatars.com/api/?name=${getInitials(user?.name)}&background=6366f1&color=fff&size=128&bold=true`} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full mr-2 object-cover ring-2 ring-indigo-50"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${getInitials(user?.name)}&background=6366f1&color=fff&size=128&bold=true`;
                    }}
                  />
                  <span className="font-ui">{user?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 hidden group-hover:block border border-gray-100">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200 font-ui"
                  >
                    <FaUser className="inline mr-2" /> Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200 font-ui"
                  >
                    <FaSignOutAlt className="inline mr-2" /> Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="font-ui text-gray-600 hover:text-indigo-600 transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="font-ui bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all duration-200 shadow-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={toggleMenu}
        >
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Search Bar - shows when search is toggled */}
      {searchOpen && (
        <div className="bg-indigo-50 py-3 px-4 border-t border-b border-indigo-100">
          <div className="container mx-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search for blogs, authors, topics..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <button 
                onClick={toggleSearch}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600"
              >
                <FaTimes size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white px-4 py-4 shadow-inner border-t border-gray-100">
          <nav className="flex flex-col space-y-4 pb-2">
            <Link to="/" className={`${isActive('/')} font-ui transition-colors duration-200`} onClick={() => setIsOpen(false)}>
              Home
            </Link>
            
            <Link to="/blogs" className={`${isActive('/blogs')} font-ui transition-colors duration-200`} onClick={() => setIsOpen(false)}>
              Explore
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/blogs/create" 
                  className="font-ui text-gray-600 hover:text-indigo-600 transition-colors duration-200 flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <FaPen className="mr-2" /> Write a Blog
                </Link>
                <Link 
                  to="/profile" 
                  className="font-ui text-gray-600 hover:text-indigo-600 transition-colors duration-200 flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <FaUser className="mr-2" /> Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="font-ui text-gray-600 hover:text-indigo-600 transition-colors duration-200 flex items-center"
                >
                  <FaSignOutAlt className="mr-2" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="font-ui text-gray-600 hover:text-indigo-600 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="font-ui bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all duration-200 shadow-sm inline-block w-fit"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header; 