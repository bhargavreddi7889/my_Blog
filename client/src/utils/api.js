import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to false to avoid CORS issues
  timeout: 15000, // Increase timeout for slower connections
});

// Separate base URL for static content (without /api)
const staticBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api')
  .replace(/\/api\/?$/, ''); // Remove /api at the end if present

console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5001/api');
console.log('Static Base URL:', staticBaseUrl);

// Add a request interceptor to include auth token in headers
api.interceptors.request.use(
  (config) => {
    // Log API requests in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to request headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`API Response (${response.status}): ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Log detailed error information
    if (error.response) {
      // Server responded with an error status code
      console.error(`API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error: No response received', error.request);
    } else {
      // Error setting up the request
      console.error('API Error:', error.message);
    }
    
    // Handle 401 unauthorized errors (expired token, etc.)
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    
    // For 404, 500, and other errors, pass to the component to handle
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Blog API endpoints
export const blogAPI = {
  getAll: (params) => api.get('/blogs', { params }),
  getById: (id) => api.get(`/blogs/${id}`),
  create: (formData) => {
    // Use FormData for image uploads
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };
    
    // Debug output for FormData contents
    if (import.meta.env.DEV) {
      console.log('Blog FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : (key === 'content' ? '[HTML Content]' : value)}`);
      }
    }
    
    return api.post('/blogs', formData, config);
  },
  update: (id, formData) => {
    // Use FormData for image uploads
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };
    
    // Debug output for FormData contents
    if (import.meta.env.DEV) {
      console.log('Blog Update FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : (key === 'content' ? '[HTML Content]' : value)}`);
      }
    }
    
    return api.put(`/blogs/${id}`, formData, config);
  },
  delete: (id) => api.delete(`/blogs/${id}`),
  react: (id, type) => api.put(`/blogs/${id}/react`, { type }),
  getByUser: (userId) => api.get(`/users/blogs/${userId}`),
  getUserActivity: () => api.get('/users/activity'),
};

// Comment API endpoints
export const commentAPI = {
  create: (blogId, data) => api.post(`/comments/blog/${blogId}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
  like: (id) => api.put(`/comments/${id}/like`),
  update: (id, data) => api.put(`/comments/${id}`, data),
  getForBlog: (blogId) => api.get(`/comments/blog/${blogId}`),
};

// User API endpoints
export const userAPI = {
  updateProfile: (formData) => {
    // Use FormData for avatar uploads
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    return api.put('/users/update-profile', formData, config);
  },
  deleteAccount: () => api.delete('/users/me'),
  getSavedBlogs: () => api.get('/users/saved-blogs'),
  saveBlog: (blogId) => api.post(`/users/saved-blogs/${blogId}`),
  unsaveBlog: (blogId) => api.delete(`/users/saved-blogs/${blogId}`),
  getUserProfile: (userId) => api.get(`/users/profile/${userId}`),
  getStats: () => api.get('/users/stats'),
  getUserActivity: () => api.get('/users/activity'),
};

// Helper function to get items of a certain type
export const getItems = async (type, params = {}) => {
  try {
    let response;
    
    switch (type) {
      case 'blogs':
        response = await blogAPI.getAll(params);
        break;
      case 'comments':
        if (params.blogId) {
          response = await commentAPI.getForBlog(params.blogId);
        }
        break;
      case 'users':
        if (params.id) {
          response = await userAPI.getUserProfile(params.id);
        }
        break;
      default:
        throw new Error(`Unknown item type: ${type}`);
    }
    
    // Return the data property from the response
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    throw error;
  }
};

// Helper function to get a single item by ID
export const getItem = async (type, id, params = {}) => {
  try {
    let response;
    
    switch (type) {
      case 'blogs':
        response = await blogAPI.getById(id);
        break;
      case 'users':
        response = await userAPI.getUserProfile(id);
        break;
      default:
        throw new Error(`Unknown item type: ${type}`);
    }
    
    // Return the data property from the response
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error fetching ${type} with id ${id}:`, error);
    throw error;
  }
};

// Helper function to delete an item
export const deleteItem = async (type, id) => {
  try {
    let response;
    
    switch (type) {
      case 'blogs':
        response = await blogAPI.delete(id);
        break;
      case 'comments':
        response = await commentAPI.delete(id);
        break;
      default:
        throw new Error(`Unknown item type: ${type}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error deleting ${type} with id ${id}:`, error);
    throw error;
  }
};

// Helper function to get comments for a blog
export const getComments = async (blogId) => {
  try {
    // Extract actual ID from any query parameters
    const actualBlogId = blogId.split('?')[0];
    
    // Use the full blogId to include any cache-busting parameters
    const response = await commentAPI.getForBlog(actualBlogId);
    
    // Log the raw response to help with debugging
    console.log('Raw comment API response:', JSON.stringify(response.data));
    
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error fetching comments for blog ${blogId}:`, error);
    throw error;
  }
};

// Helper for image URLs
export const getImageUrl = (path) => {
  if (!path) return null;

  // Don't log for default avatars to reduce console spam
  const isDefaultAvatar = path === 'default-avatar.jpg';
  if (!isDefaultAvatar) {
    console.log('Original image path:', path);
  }
  
  // Handle default avatar directly
  if (isDefaultAvatar) {
    return `${staticBaseUrl}/uploads/default-avatar.jpg`;
  }
  
  // Normalize backslashes to forward slashes (for Windows paths)
  let normalizedPath = path.replace(/\\/g, '/');
  
  // Handle paths that start with /uploads or uploads
  if (normalizedPath.includes('/uploads') || normalizedPath.includes('uploads')) {
    // Make sure path starts with / for URL formatting
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    
    // Ensure the path format is correct for URLs
    normalizedPath = normalizedPath.replace(/\/+/g, '/'); // Replace multiple slashes with single
    
    // Use staticBaseUrl (without /api) for images
    const imageUrl = `${staticBaseUrl}${normalizedPath}`;
    if (!isDefaultAvatar) {
      console.log('Resolved image URL:', imageUrl);
    }
    return imageUrl;
  }
  
  // For external URLs or already complete paths
  if (!isDefaultAvatar) {
    console.log('Using original path:', path);
  }
  return path;
};

// Helper to get user initials for avatar
export const getInitials = (name) => {
  if (!name) return 'U';
  
  // Split the name by spaces and get the first character of each part
  const nameParts = name.split(' ');
  
  if (nameParts.length === 1) {
    // If only one name, return the first character capitalized
    return name.charAt(0).toUpperCase();
  } else {
    // Return the first character of first and last name
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }
};

export default api; 