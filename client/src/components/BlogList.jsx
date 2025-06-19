import { Link } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { getItems, getImageUrl, getInitials, deleteItem } from '../utils/api';
import { FaCalendarAlt, FaEye, FaComment, FaHeart, FaEdit, FaTrash } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

// Image placeholder as base64
const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkJsb2cgSW1hZ2U8L3RleHQ+PC9zdmc+";

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAdmin } = useContext(AuthContext);
  
  useEffect(() => {
    fetchBlogs();
  }, []);
  
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await getItems('blogs');
      if (data) {
        setBlogs(data);
      }
    } catch (err) {
      setError('Failed to load blogs. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the blog and check ownership
    const blogToDelete = blogs.find(blog => blog._id === id);
    const isAuthor = user && blogToDelete?.author?._id === user.id;
    const canModify = isAuthor || isAdmin;
    
    if (!canModify) {
      toast.error('You are not authorized to delete this blog');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      try {
        // Show loading indicator
        toast.info('Deleting blog...', { autoClose: false, toastId: 'deleteBlog' });
        
        // Call API to delete blog
        const response = await deleteItem('blogs', id);
        
        // If delete was successful, update UI
        if (response && response.data && response.data.success) {
          // Remove blog from state
          setBlogs(prevBlogs => prevBlogs.filter(blog => blog._id !== id));
          
          // Show success message
          toast.dismiss('deleteBlog');
          toast.success('Blog deleted successfully');
        } else {
          throw new Error('Failed to delete blog');
        }
      } catch (err) {
        toast.dismiss('deleteBlog');
        if (err.response?.status === 401) {
          toast.error('You are not authorized to delete this blog');
        } else {
          toast.error('Failed to delete blog: ' + (err.response?.data?.message || err.message || 'Unknown error'));
        }
        console.error('Delete error:', err);
      }
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-8">Explore Blogs</h1>
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={fetchBlogs} 
            className="font-ui mt-2 text-indigo-600 hover:text-indigo-800"
          >
            Try Again
          </button>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <h2 className="font-heading text-2xl text-gray-700 mb-2">No Blogs Found</h2>
          <p className="text-gray-500 mb-4">Be the first to share your thoughts!</p>
          <Link 
            to="/blogs/create" 
            className="font-ui bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 transition-all duration-200 inline-block"
          >
            Create Blog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => {
            const isAuthor = user && blog.author?._id === user.id;
            const canModify = isAuthor || isAdmin;
            
            return (
              <div key={blog._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                {blog.coverImage ? (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img 
                      src={getImageUrl(blog.coverImage)} 
                      alt={blog.title} 
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-indigo-50 flex items-center justify-center">
                    <span className="text-indigo-300 font-heading font-medium">No Image</span>
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <img 
                        src={getImageUrl(blog.author?.avatar) || `https://ui-avatars.com/api/?name=${getInitials(blog.author?.name)}&background=6366f1&color=fff&size=128&bold=true`} 
                        alt={blog.author?.name || 'Author'} 
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-50"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${getInitials(blog.author?.name)}&background=6366f1&color=fff&size=128&bold=true`;
                        }}
                      />
                      <span className="font-ui text-sm font-medium text-gray-700 ml-2">{blog.author?.name || 'Unknown'}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <FaCalendarAlt className="mr-1" />
                      <span>{formatDate(blog.createdAt)}</span>
                    </div>
                  </div>
                  
                  <h2 className="font-heading text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    <Link to={`/blogs/${blog._id}`} className="hover:text-indigo-600 transition-colors">
                      {blog.title}
                    </Link>
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3 font-ui text-sm">
                    {blog.summary || blog.description || 'No description available.'}
                  </p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <FaEye className="mr-1" />
                        {blog.views || 0}
                      </span>
                      <Link 
                        to={`/blogs/${blog._id}#comments`} 
                        className="flex items-center hover:text-indigo-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaComment className="mr-1" />
                        {blog.commentCount || 0}
                      </Link>
                      <span className="flex items-center">
                        <FaHeart className="mr-1" />
                        {blog.reactions?.likes || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Only show edit/delete buttons for owner or admin */}
                      {canModify && (
                        <>
                          <Link 
                            to={`/blogs/edit/${blog._id}`} 
                            className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 p-1.5 rounded-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                            title="Edit blog"
                          >
                            <FaEdit size={14} />
                          </Link>
                          <button 
                            onClick={(e) => handleDelete(blog._id, e)}
                            className="text-red-600 hover:text-red-800 bg-red-50 p-1.5 rounded-full flex items-center justify-center"
                            title="Delete blog"
                          >
                            <FaTrash size={14} />
                          </button>
                        </>
                      )}
                      <Link 
                        to={`/blogs/${blog._id}`} 
                        className="font-ui text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-2"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BlogList; 