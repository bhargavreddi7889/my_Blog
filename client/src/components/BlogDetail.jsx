import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext, useRef } from 'react';
import { getItem, getComments, deleteItem, getImageUrl, getInitials } from '../utils/api';
import { blogAPI, userAPI } from '../utils/api';
import AuthContext from '../context/AuthContext';
import CommentSection from './CommentSection';
import { FaCalendarAlt, FaTag, FaTrash, FaEdit, FaHeart, FaRegHeart, FaShare, FaBookmark, FaRegBookmark, FaComment } from 'react-icons/fa';
import parse from 'html-react-parser';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';
import { commentAPI } from '../utils/api';

// Image placeholder as base64
const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkJsb2cgSW1hZ2U8L3RleHQ+PC9zdmc+";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated } = useContext(AuthContext);
  const commentSectionRef = useRef(null);
  
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isAuthor = user && blog?.author?._id === user.id;
  
  useEffect(() => {
    fetchBlog();
    fetchComments();
    
    // Check if this blog is saved by the user
    const checkSavedStatus = async () => {
      if (isAuthenticated && user) {
        try {
          const savedBlogs = await userAPI.getSavedBlogs();
          if (savedBlogs && savedBlogs.data && savedBlogs.data.data) {
            const isSaved = savedBlogs.data.data.some(savedBlog => savedBlog._id === id);
            setSaved(isSaved);
          }
        } catch (err) {
          console.error('Error checking saved status:', err);
        }
      }
    };
    
    checkSavedStatus();

    // Check if URL has #comments hash to scroll to comments
    if (window.location.hash === '#comments') {
      // Use a small timeout to ensure the component is fully loaded
      setTimeout(() => {
        scrollToComments();
      }, 500);
    }
  }, [id, isAuthenticated, user]);
  
  useEffect(() => {
    if (blog && user) {
      console.log('Blog author ID:', blog.author?._id);
      console.log('Current user ID:', user.id);
      console.log('Is author match?', blog.author?._id === user.id);
      console.log('Is admin?', isAdmin);
      console.log('Should show delete button?', isAuthor || isAdmin);
    }
  }, [blog, user, isAdmin, isAuthor]);
  
  const fetchBlog = async () => {
    try {
      setLoading(true);
      const data = await getItem('blogs', id);
      if (data) {
        setBlog(data);
        
        // Check if this blog has been liked by the current user
        const hasLiked = data.reactionUsers?.likes?.includes(user?.id);
        setLiked(hasLiked);
        
        // Get the total number of likes
        setLikes(data.reactions?.likes || 0);
      }
    } catch (err) {
      setError('Failed to load blog. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchComments = async () => {
    try {
      console.log('Fetching comments for blog:', id);
      
      // Use direct API call 
      const response = await commentAPI.getForBlog(id);
      
      if (response && response.data) {
        const comments = response.data.data;
        console.log('Comments fetched successfully:', comments.length, 'comments found');
        
        // Log each comment and its replies to debug
        if (comments && comments.length > 0) {
          comments.forEach(comment => {
            if (comment.replies && comment.replies.length > 0) {
              console.log(`Comment ${comment._id} has ${comment.replies.length} replies`);
            }
          });
        }
        
        setComments(comments || []);
      } else {
        console.log('No comments returned from API');
        setComments([]);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      setComments([]);
    }
  };
  
  const addComment = (newComment) => {
    console.log('Adding new comment to state:', newComment);
    setComments(prevComments => {
      // Make sure we're not adding a duplicate
      if (prevComments.some(c => c._id === newComment._id)) {
        return prevComments;
      }
      return [...prevComments, newComment];
    });
  };
  
  const handleDelete = async () => {
    // First verify if the user is allowed to delete this blog
    if (!isAuthor && !isAdmin) {
      toast.error('You are not authorized to delete this blog');
      return;
    }

    if (window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        // Show loading indicator
        toast.info('Deleting blog...', { autoClose: false, toastId: 'deleteBlog' });
        
        // Call API directly instead of using the helper function
        const response = await blogAPI.delete(id);
        
        if (response && response.data && response.data.success) {
          toast.dismiss('deleteBlog');
          toast.success('Blog deleted successfully');
          // Navigate back to blog list
          navigate('/blogs');
        } else {
          throw new Error('Failed to delete blog');
        }
      } catch (err) {
        toast.dismiss('deleteBlog');
        // Handle unauthorized error specifically
        if (err.response?.status === 401) {
          toast.error('You are not authorized to delete this blog');
        } else {
          toast.error('Failed to delete blog: ' + (err.response?.data?.message || err.message || 'Unknown error'));
        }
        console.error('Delete error:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to like this blog');
      navigate('/login', { state: { from: `/blogs/${id}` } });
      return;
    }
    
    try {
      console.log('Sending reaction request for blog:', id);
      const response = await blogAPI.react(id, 'likes');
      console.log('Like response:', response.data);
      
      if (response.data.success) {
        // Toggle like status based on API response
        const newLikedStatus = response.data.hasReacted;
        setLiked(newLikedStatus);
        
        // Update the like count directly from the response data
        setLikes(response.data.data.likes);
        
        toast.success(newLikedStatus ? 'Blog liked!' : 'Like removed');
      }
    } catch (err) {
      toast.error('Failed to update like');
      console.error('Error liking blog:', err);
    }
  };
  
  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to save this blog');
      navigate('/login', { state: { from: `/blogs/${id}` } });
      return;
    }
    
    try {
      if (saved) {
        await userAPI.unsaveBlog(id);
        setSaved(false);
        toast.success('Blog removed from saved');
      } else {
        await userAPI.saveBlog(id);
        setSaved(true);
        toast.success('Blog saved successfully');
      }
    } catch (err) {
      toast.error('Failed to save blog');
      console.error('Error saving blog:', err);
    }
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: blog.summary || 'Check out this blog post!',
        url: window.location.href
      })
        .then(() => toast.success('Blog shared successfully'))
        .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Blog link copied to clipboard'))
        .catch(err => toast.error('Failed to copy link'));
    }
  };

  const scrollToComments = () => {
    if (commentSectionRef.current) {
      commentSectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-heading text-red-600 mb-2">Error Loading Blog</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/blogs" className="font-ui bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all duration-200">
            Return to Blogs
          </Link>
        </div>
      ) : blog ? (
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            {blog.coverImage && (
              <img 
                src={getImageUrl(blog.coverImage)} 
                alt={blog.title} 
                className="w-full h-[400px] object-cover rounded-xl shadow-md mb-6"
                onError={(e) => {
                  console.error(`Failed to load image: ${e.target.src}`);
                  e.target.onerror = null;
                  e.target.src = placeholderImage;
                  toast.error('Failed to load blog image');
                }}
              />
            )}
            
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">{blog.title}</h1>
            
            <div className="flex items-center mb-6">
              <img 
                src={getImageUrl(blog.author?.avatar) || `https://ui-avatars.com/api/?name=${getInitials(blog.author?.name)}&background=6366f1&color=fff&size=128&bold=true`} 
                alt={blog.author?.name} 
                className="w-12 h-12 rounded-full mr-4 ring-2 ring-indigo-100 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${getInitials(blog.author?.name)}&background=6366f1&color=fff&size=128&bold=true`;
                }}
              />
              <div>
                <p className="font-ui font-medium text-gray-800">{blog.author?.name}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <FaCalendarAlt className="mr-1" size={14} />
                  <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags?.map((tag, index) => (
                <span 
                  key={index} 
                  className="font-ui text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full flex items-center"
                >
                  <FaTag className="mr-1" size={10} />
                  {tag}
                </span>
              ))}
            </div>
            
            {/* Only show edit/delete buttons if user is the author or admin */}
            {(isAuthor || isAdmin) && (
              <div className="flex gap-4 mb-6">
                <Link 
                  to={`/blogs/edit/${id}`} 
                  className="font-ui text-sm flex items-center bg-indigo-100 text-indigo-600 hover:bg-indigo-200 py-2 px-4 rounded-md transition-colors"
                >
                  <FaEdit className="mr-2" /> Edit Blog
                </Link>
                <button 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className="font-ui text-sm flex items-center bg-red-100 text-red-600 hover:bg-red-200 py-2 px-4 rounded-md transition-colors"
                >
                  <FaTrash className="mr-2" /> {isDeleting ? 'Deleting...' : 'Delete Blog'}
                </button>
              </div>
            )}
            
            {/* Interactive buttons */}
            <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 mb-8">
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleLike}
                  className="font-ui flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  {liked ? <FaHeart className="text-indigo-600 mr-1.5" /> : <FaRegHeart className="mr-1.5" />}
                  <span>{likes} Likes</span>
                </button>
                <button 
                  onClick={handleShare}
                  className="font-ui flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <FaShare className="mr-1.5" />
                  <span>Share</span>
                </button>
                <button 
                  onClick={scrollToComments}
                  className="font-ui flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <FaComment className="mr-1.5" />
                  <span>{comments.length} Comments</span>
                </button>
              </div>
              <button 
                onClick={handleSave}
                className="font-ui flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {saved ? <FaBookmark className="text-indigo-600 mr-1.5" /> : <FaRegBookmark className="mr-1.5" />}
                <span>{saved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
          
          <div className="prose prose-indigo lg:prose-lg mx-auto mb-12 font-ui">
            {parse(blog.content || '')}
          </div>
          
          <div className="border-t border-gray-100 pt-8" ref={commentSectionRef} id="comments">
            <CommentSection 
              blogId={id} 
              comments={comments} 
              addComment={addComment} 
              refreshComments={fetchComments} 
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-heading text-gray-600 mb-2">Blog Not Found</h2>
          <Link to="/blogs" className="font-ui bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all duration-200">
            Return to Blogs
          </Link>
        </div>
      )}
    </div>
  );
};

export default BlogDetail; 