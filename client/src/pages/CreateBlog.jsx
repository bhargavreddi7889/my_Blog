import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FaImage, FaTimes, FaSpinner } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { blogAPI } from '../utils/api';

// Quill editor modules and formats
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false
  }
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent',
  'color', 'background',
  'link', 'image'
];

const CreateBlog = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For edit mode
  const { isAuthenticated, user, checkAuthStatus } = useContext(AuthContext);
  const isEditMode = !!id;
  const quillRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categories: [],
    tags: [],
    coverImage: null
  });

  const [selectedCategory, setSelectedCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([
    'Technology', 'Programming', 'Web Development', 'Data Science',
    'Design', 'UX/UI', 'Mobile', 'Lifestyle', 'Travel', 'Food',
    'Health', 'Fitness', 'Personal', 'Business', 'Marketing', 'Other'
  ]);

  // Check authentication
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        // Try to refresh authentication
        await checkAuthStatus();
        
        // If still not authenticated, redirect to login
        if (!isAuthenticated) {
          navigate('/login', { state: { from: isEditMode ? `/blogs/edit/${id}` : '/blogs/create', message: 'You must be logged in to create a blog' } });
        }
      }
    };
    
    verifyAuth();
  }, [isAuthenticated, navigate, id, isEditMode, checkAuthStatus]);

  // Fetch blog data for edit mode
  useEffect(() => {
    const fetchBlog = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const response = await blogAPI.getById(id);
          const blog = response.data.data;
          
          if (!blog) {
            throw new Error('Blog not found');
          }
          
          // Check if the user is the author
          if (user && blog.author._id !== user._id) {
            setError('You do not have permission to edit this blog');
            setLoading(false);
            return;
          }
          
          setFormData({
            title: blog.title || '',
            summary: blog.summary || '',
            content: blog.content || '',
            categories: blog.categories || [],
            tags: blog.tags || [],
            coverImage: null // Can't prefill file input
          });
          
          setCoverImagePreview(blog.coverImage);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching blog:', err);
          setError(err.response?.data?.message || 'Failed to fetch blog data for editing');
          setLoading(false);
        }
      }
    };
    
    if (isEditMode && user) {
      fetchBlog();
    }
  }, [id, isEditMode, user]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setFormData({ ...formData, coverImage: file });
    setCoverImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  // Handle text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle rich text editor
  const handleContentChange = (content) => {
    // Store the content even if it's empty
    setFormData(prevState => ({ ...prevState, content }));
    
    // Just for validation - remove HTML tags and check if there's actual content
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      setError('Content cannot be empty');
    } else {
      setError(null);
    }
  };

  // Add category
  const handleAddCategory = () => {
    if (!selectedCategory) return;
    
    if (formData.categories.includes(selectedCategory)) {
      setSelectedCategory('');
      return;
    }
    
    setFormData({
      ...formData,
      categories: [...formData.categories, selectedCategory]
    });
    setSelectedCategory('');
  };

  // Remove category
  const handleRemoveCategory = (category) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter(cat => cat !== category)
    });
  };

  // Add tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (formData.tags.includes(newTag)) {
      setTagInput('');
      return;
    }
    
    setFormData({
      ...formData,
      tags: [...formData.tags, newTag]
    });
    setTagInput('');
  };

  // Add tag on Enter key
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Remove tag
  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  // Submit blog
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.summary.trim()) {
      setError('Summary is required');
      return;
    }
    
    // Check if content is empty or only contains HTML tags
    const plainContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (!plainContent) {
      setError('Content is required');
      return;
    }
    
    if (formData.categories.length === 0) {
      setError('Please select at least one category');
      return;
    }
    
    if (!isEditMode && !formData.coverImage && !coverImagePreview) {
      setError('Cover image is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create form data for file upload
      const blogFormData = new FormData();
      blogFormData.append('title', formData.title.trim());
      blogFormData.append('summary', formData.summary.trim());
      blogFormData.append('content', formData.content);
      
      if (formData.coverImage) {
        blogFormData.append('coverImage', formData.coverImage);
      }
      
      // Parse JSON before sending to avoid string serialization issues
      blogFormData.append('categories', JSON.stringify(formData.categories));
      blogFormData.append('tags', JSON.stringify(formData.tags));
      
      // Log the form data for debugging
      if (import.meta.env.DEV) {
        for (let [key, value] of blogFormData.entries()) {
          console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : (key === 'content' ? '[HTML Content]' : value)}`);
        }
      }
      
      let response;
      
      if (isEditMode) {
        response = await blogAPI.update(id, blogFormData);
        setSuccess('Blog post updated successfully!');
        
        // Navigate to the updated blog after a short delay
        setTimeout(() => {
          navigate(`/blogs/${response.data.data._id}`);
        }, 1500);
      } else {
        response = await blogAPI.create(blogFormData);
        setSuccess('Blog post published successfully!');
        
        // Reset form if staying on page
        setFormData({
          title: '',
          summary: '',
          content: '',
          categories: [],
          tags: [],
          coverImage: null
        });
        setCoverImagePreview(null);
        
        // Navigate to the new blog after a short delay
        setTimeout(() => {
          navigate(`/blogs/${response.data.data._id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Blog submission error:', err);
      setError(err.response?.data?.message || 'Failed to publish blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Blog Post' : 'Create Blog Post'}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* Title */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter blog title"
            required
          />
        </div>
        
        {/* Summary */}
        <div className="mb-6">
          <label htmlFor="summary" className="block text-gray-700 font-medium mb-2">
            Summary <span className="text-red-500">*</span>
          </label>
          <textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Write a brief summary of your blog post"
            rows="3"
            required
          />
        </div>
        
        {/* Content Editor */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <div className="rounded">
            <ReactQuill
              ref={quillRef}
              value={formData.content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              className="min-h-[300px]"
              placeholder="Write your blog content here..."
              theme="snow"
            />
          </div>
          {formData.content && formData.content.replace(/<[^>]*>/g, '').trim() === '' && (
            <p className="text-red-500 text-sm mt-1">Content cannot be empty</p>
          )}
        </div>
        
        {/* Cover Image */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Cover Image {!isEditMode && <span className="text-red-500">*</span>}
          </label>
          
          {coverImagePreview ? (
            <div className="relative mb-3">
              <img 
                src={coverImagePreview} 
                alt="Cover preview" 
                className="w-full h-48 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, coverImage: null });
                  setCoverImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center mb-3">
              <input
                type="file"
                id="coverImage"
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
              <label 
                htmlFor="coverImage" 
                className="flex flex-col items-center cursor-pointer"
              >
                <FaImage className="text-gray-400 text-3xl mb-2" />
                <span className="text-gray-500 font-medium">Click to upload an image</span>
                <span className="text-gray-400 text-sm mt-1">JPEG, PNG, GIF, WebP (max 5MB)</span>
              </label>
            </div>
          )}
        </div>
        
        {/* Categories */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Categories <span className="text-red-500">*</span>
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.categories.map(category => (
              <div 
                key={category}
                className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center"
              >
                <span>{category}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(category)}
                  className="ml-2 text-indigo-600 hover:text-indigo-800"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a category</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={!selectedCategory}
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              Add
            </button>
          </div>
        </div>
        
        {/* Tags */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Tags
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map(tag => (
              <div 
                key={tag}
                className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-gray-600 hover:text-gray-800"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add a tag and press Enter"
              className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              Add
            </button>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                {isEditMode ? 'Updating...' : 'Publishing...'}
              </>
            ) : (
              <>{isEditMode ? 'Update Blog Post' : 'Publish Blog Post'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBlog; 