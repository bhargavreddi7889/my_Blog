import { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaUser, FaCalendarAlt, FaBlog, FaHeart, FaComment, FaEdit, FaSignOutAlt, FaThumbsUp, FaEye, FaReply, FaPen, FaCircle } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { userAPI, blogAPI, getImageUrl, getInitials } from '../utils/api';
import moment from 'moment';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

// Image placeholder as base64
const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkJsb2cgSW1hZ2U8L3RleHQ+PC9zdmc+";

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, logout, updateUserProfile, checkAuthStatus } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [userBlogs, setUserBlogs] = useState([]);
  const [activeTab, setActiveTab] = useState('blogs');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: null
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Add new state for user activity
  const [userActivity, setUserActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Add state for saved blogs
  const [savedBlogs, setSavedBlogs] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  
  // Fetch user data and determine if this is the current user's profile
  // Use useCallback to prevent recreation of the function on every render
  const fetchUserData = useCallback(async () => {
    if (isLoading === false) return; // Prevent multiple fetches
    
    setError(null);
    
    try {
      // If the user is not authenticated when the component mounts
      if (!currentUser) {
        await checkAuthStatus(); // Try to refresh authentication state
      }
      
      // Check if the user is authenticated when no ID is provided
      if (!id && !currentUser) {
        navigate('/login', { state: { from: '/profile', message: 'You must be logged in to view your profile' } });
        setIsLoading(false);
        return;
      }
      
      let userData;
      
      // If no ID in URL, or ID matches current user, show current user profile
      if (!id || (currentUser && id === currentUser._id)) {
        if (!currentUser) {
          setError('You must be logged in to view your profile');
          setIsLoading(false);
          return;
        }
        
        userData = currentUser;
        setIsOwnProfile(true);
        
        // Initialize form data
        setFormData({
          name: userData.name || '',
          bio: userData.bio || '',
          avatar: null
        });
        
        // Fetch additional user stats
        try {
          const statsResponse = await userAPI.getStats();
          console.log('Stats data:', statsResponse.data);
          setStats(statsResponse.data.data);
        } catch (statsErr) {
          console.error('Error fetching user stats:', statsErr);
          // Set default stats if API call fails
          setStats({
            totalBlogs: 0,
            totalComments: 0,
            totalReactions: 0,
            totalLikes: 0,
            reactedBlogsCount: 0
          });
        }
      } else {
        // Fetch other user profile
        try {
          const response = await userAPI.getUserProfile(id);
          userData = response.data.data;
          setIsOwnProfile(currentUser && userData._id === currentUser._id);
        } catch (err) {
          if (err.response?.status === 404) {
            setError('User not found');
          } else {
            setError('Error loading profile');
          }
          setIsLoading(false);
          return;
        }
      }
      
      if (!userData) {
        setError('User not found');
        setIsLoading(false);
        return;
      }
      
      setUser(userData);
      
      // Fetch user blogs
      if (userData && userData._id) {
        try {
          const blogsResponse = await blogAPI.getByUser(userData._id);
          setUserBlogs(blogsResponse.data.data || []);
        } catch (blogsErr) {
          console.error('Error fetching user blogs:', blogsErr);
          setUserBlogs([]); // Initialize with empty array on error
        }
      } else {
        setUserBlogs([]);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile data');
      setUserBlogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUser, navigate, checkAuthStatus]);

  // Add a function to fetch user activity
  const fetchUserActivity = async () => {
    if (!isOwnProfile || activeTab !== 'activity') return;
    
    setActivityLoading(true);
    try {
      const response = await userAPI.getUserActivity();
      if (response && response.data && response.data.data) {
        console.log('Activity data:', response.data.data);
        setUserActivity(response.data.data);
      } else {
        // Handle unexpected response format
        setUserActivity([]);
        console.error('Unexpected activity data format:', response);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
      setUserActivity([]);
      // Don't automatically change tabs on error
    } finally {
      setActivityLoading(false);
    }
  };

  // Add function to fetch saved blogs
  const fetchSavedBlogs = async () => {
    if (!isOwnProfile || activeTab !== 'saved') return;
    
    setLoadingSaved(true);
    try {
      const response = await userAPI.getSavedBlogs();
      if (response && response.data && response.data.data) {
        console.log('Saved blogs:', response.data.data);
        setSavedBlogs(response.data.data);
      } else {
        setSavedBlogs([]);
      }
    } catch (error) {
      console.error('Error fetching saved blogs:', error);
      setSavedBlogs([]);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Only run fetch once when component mounts or when critical dependencies change
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  // Add this to the main useEffect
  useEffect(() => {
    if (isOwnProfile && activeTab === 'activity') {
      fetchUserActivity();
    }
  }, [isOwnProfile, activeTab]);
  
  // Add effect to fetch saved blogs when tab changes
  useEffect(() => {
    if (isOwnProfile && activeTab === 'saved') {
      fetchSavedBlogs();
    }
  }, [isOwnProfile, activeTab]);
  
  // Handle input change for edit profile form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }
    
    console.log('Selected avatar file:', file.name, file.type, file.size);
    setFormData({ ...formData, avatar: file });
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    console.log('Created preview URL:', previewUrl);
    setAvatarPreview(previewUrl);
    setError(null);
  };
  
  // Submit profile updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Submitting profile update');
      const profileFormData = new FormData();
      profileFormData.append('name', formData.name);
      profileFormData.append('bio', formData.bio);
      
      if (formData.avatar) {
        console.log('Adding avatar file to form data:', formData.avatar.name);
        profileFormData.append('avatar', formData.avatar);
      }
      
      // Log FormData contents for debugging
      for (let [key, value] of profileFormData.entries()) {
        console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : value}`);
      }
      
      const response = await userAPI.updateProfile(profileFormData);
      
      if (response.data && response.data.data) {
        console.log('Profile updated successfully:', response.data.data);
        updateUserProfile(response.data.data);
        setUser(response.data.data);
        setIsEditing(false);
        
        // Display success message
        toast.success('Profile updated successfully');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-700">User not found</h2>
        <p className="text-gray-500 mt-2">The user you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:shrink-0 p-6 flex justify-center md:justify-start">
            <img 
              src={avatarPreview || getImageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${getInitials(user.name)}&background=6366f1&color=fff&size=128&bold=true`} 
              alt={user.name} 
              className="h-32 w-32 rounded-full object-cover border-4 border-indigo-100"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${getInitials(user.name)}&background=6366f1&color=fff&size=128&bold=true`;
              }}
            />
          </div>
          <div className="p-6 md:p-8 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                {user.bio && <p className="mt-2 text-gray-600">{user.bio}</p>}
                <div className="mt-2 flex items-center text-gray-500">
                  <FaCalendarAlt className="mr-2" />
                  <span>Joined {moment(user.createdAt).format('MMMM YYYY')}</span>
                </div>
              </div>
              
              {isOwnProfile && (
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        <FaEdit className="mr-2" /> Edit Profile
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                      >
                        <FaSignOutAlt className="mr-2" /> Logout
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex items-center text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {isOwnProfile && stats && (
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-indigo-600">{stats.totalBlogs || 0}</div>
                  <div className="text-sm text-gray-600">Blog Posts</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-indigo-600">{stats.totalComments || 0}</div>
                  <div className="text-sm text-gray-600">Comments</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-indigo-600">{stats.totalReactions || 0}</div>
                  <div className="text-sm text-gray-600">Reactions</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Profile Form */}
      {isEditing && (
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="bio" className="block text-gray-700 font-medium mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
                rows="3"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Profile Picture
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Choose File
                </label>
                <span className="ml-3 text-gray-500 text-sm">
                  {formData.avatar ? formData.avatar.name : 'No file chosen'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Tabs */}
      <div className="mt-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('blogs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'blogs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaBlog className="inline mr-2" /> Blog Posts
          </button>
          
          {isOwnProfile && (
            <>
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'saved'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaHeart className="inline mr-2" /> Saved Posts
              </button>
              
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaComment className="inline mr-2" /> Recent Activity
              </button>
            </>
          )}
        </nav>
      </div>
      
      {/* Content based on active tab */}
      <div className="mt-6">
        {activeTab === 'blogs' && (
          <div>
            {userBlogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No blog posts yet.</p>
                {isOwnProfile && (
                  <Link to="/blogs/create" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    Create Your First Blog
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {userBlogs.map((blog) => (
                  <div key={blog._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {blog.coverImage && (
                      <img 
                        src={getImageUrl(blog.coverImage)} 
                        alt={blog.title} 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }}
                      />
                    )}
                    <div className="p-5">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        {blog.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {blog.summary}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">
                          {moment(blog.createdAt).format('MMM D, YYYY')}
                        </span>
                        <Link to={`/blogs/${blog._id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                          Read More
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'saved' && isOwnProfile && (
          <div>
            {loadingSaved ? (
              <LoadingSpinner />
            ) : savedBlogs.length === 0 ? (
              <div className="text-center py-8">
                <FaHeart className="mx-auto text-gray-400 text-4xl mb-3" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No saved blogs yet</h3>
                <p className="text-gray-500 mb-4">Blogs you save will appear here</p>
                <Link to="/blogs" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                  Browse Blogs
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {savedBlogs.map((blog) => (
                  <div key={blog._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {blog.coverImage && (
                      <img 
                        src={getImageUrl(blog.coverImage)} 
                        alt={blog.title} 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }}
                      />
                    )}
                    <div className="p-5">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        {blog.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {blog.summary}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <img 
                            src={getImageUrl(blog.author?.avatar) || `https://ui-avatars.com/api/?name=${getInitials(blog.author?.name)}&background=6366f1&color=fff&size=128&bold=true`} 
                            alt={blog.author?.name || 'Author'} 
                            className="w-6 h-6 rounded-full mr-2"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${getInitials(blog.author?.name || 'A')}&background=6366f1&color=fff&size=128&bold=true`;
                            }}
                          />
                          <span className="text-gray-500 text-sm">
                            {blog.author?.name || 'Unknown'}
                          </span>
                        </div>
                        <Link to={`/blogs/${blog._id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                          Read More
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="py-4">
            {activityLoading ? (
              <LoadingSpinner />
            ) : (
              <ActivityTab activity={userActivity} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityTab = ({ activity }) => {
  if (!activity || activity.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No recent activity to show.</p>
      </div>
    );
  }

  // Filter out any invalid items (missing blog data)
  const validActivities = activity.filter(item => item && item.blog);
  
  if (validActivities.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No valid activity data to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {validActivities.map((item, index) => (
        <ActivityItem key={index} item={item} />
      ))}
    </div>
  );
};

const ActivityItem = ({ item }) => {
  if (!item || !item.blog) {
    // Skip rendering if item or item.blog is undefined
    return null;
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  const getActivityIcon = () => {
    switch (item.type) {
      case 'blog':
        return <FaPen className="text-indigo-500" />;
      case 'comment':
        return <FaComment className="text-green-500" />;
      case 'reaction':
        if (item.action === 'liked') return <FaThumbsUp className="text-pink-500" />;
        if (item.action === 'loved') return <FaHeart className="text-red-500" />;
        return <FaThumbsUp className="text-yellow-500" />;
      default:
        return <FaCircle className="text-gray-500" />;
    }
  };
  
  const getActivityText = () => {
    switch (item.type) {
      case 'blog':
        return `Created a new blog: `;
      case 'comment':
        return `Commented on `;
      case 'reaction':
        return `${item.action} `;
      default:
        return 'Interacted with ';
    }
  };
  
  return (
    <div className="flex items-start p-4 rounded-lg bg-white shadow-sm">
      <div className="flex-shrink-0 mr-3 mt-1">
        {getActivityIcon()}
      </div>
      <div className="flex-1">
        <p className="text-gray-800">
          <span className="font-medium">{getActivityText()}</span>
          <Link 
            to={`/blogs/${item.blog._id}`}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {item.blog.title}
          </Link>
        </p>
        {item.content && (
          <p className="text-gray-600 text-sm mt-1">"{item.content}"</p>
        )}
        <p className="text-gray-500 text-xs mt-1">{formatDate(item.createdAt)}</p>
      </div>
    </div>
  );
};

export default Profile; 