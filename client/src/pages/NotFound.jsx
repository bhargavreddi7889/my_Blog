import { Link } from 'react-router-dom';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-9xl font-bold text-gray-200 mb-8">404</div>
      
      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
      
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        The page you are looking for might have been removed or is temporarily unavailable.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/" 
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <FaArrowLeft /> Back to Home
        </Link>
        
        <Link 
          to="/?search=true" 
          className="btn btn-outline flex items-center justify-center gap-2"
        >
          <FaSearch /> Search Blogs
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 