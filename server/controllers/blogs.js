const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');

// @desc    Get all blogs with filtering, pagination and search
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create search query
    let searchQuery = {};
    if (req.query.search) {
      searchQuery = {
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { content: { $regex: req.query.search, $options: 'i' } },
          { categories: { $in: [new RegExp(req.query.search, 'i')] } },
          { tags: { $in: [new RegExp(req.query.search, 'i')] } }
        ]
      };
    }

    // Create query string
    let query = Blog.find({
      ...reqQuery,
      ...searchQuery
    }).populate({
      path: 'author',
      select: 'name avatar'
    });

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Blog.countDocuments({
      ...reqQuery,
      ...searchQuery
    });

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const blogs = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: blogs.length,
      pagination,
      total,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = async (req, res) => {
  try {
    // Use findOneAndUpdate with $inc for atomic increment, prevents double increments
    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id },
      { $inc: { views: 1 } }, // Atomically increment views by 1
      { new: true }
    ).populate({
      path: 'author',
      select: 'name avatar'
    }).populate({
      path: 'comments',
      select: 'content user createdAt',
      populate: {
        path: 'user',
        select: 'name avatar'
      }
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Debug the request body to help identify issues
    console.log('Request Body:', {
      title: req.body.title,
      contentLength: req.body.content ? req.body.content.length : 0,
      categoriesType: typeof req.body.categories,
      tagsType: typeof req.body.tags,
      coverImage: req.body.coverImage || 'No image'
    });

    // Add author to req.body
    req.body.author = req.user.id;
    
    // Parse categories and tags if they're sent as JSON strings
    if (req.body.categories && typeof req.body.categories === 'string') {
      try {
        req.body.categories = JSON.parse(req.body.categories);
      } catch (err) {
        console.error('Error parsing categories:', err);
        return res.status(400).json({
          success: false,
          message: 'Invalid categories format'
        });
      }
    }
    
    if (req.body.tags && typeof req.body.tags === 'string') {
      try {
        req.body.tags = JSON.parse(req.body.tags);
      } catch (err) {
        console.error('Error parsing tags:', err);
        return res.status(400).json({
          success: false,
          message: 'Invalid tags format'
        });
      }
    }
    
    // Validate required content
    if (!req.body.content || req.body.content.replace(/<[^>]*>/g, '').trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Content cannot be empty'
      });
    }

    // Create blog with processed data
    const blogData = {
      title: req.body.title,
      content: req.body.content,
      summary: req.body.summary || '',
      categories: req.body.categories || ['General'],
      tags: req.body.tags || [],
      author: req.user.id,
      coverImage: req.body.coverImage || 'default-blog.jpg'
    };

    const blog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    // Debug the request body to help identify issues
    console.log('Update Request Body:', {
      title: req.body.title,
      contentLength: req.body.content ? req.body.content.length : 0,
      categoriesType: typeof req.body.categories,
      tagsType: typeof req.body.tags,
      coverImage: req.body.coverImage || 'No new image'
    });
    
    // Parse categories and tags if they're sent as JSON strings
    if (req.body.categories && typeof req.body.categories === 'string') {
      try {
        req.body.categories = JSON.parse(req.body.categories);
      } catch (err) {
        console.error('Error parsing categories:', err);
        return res.status(400).json({
          success: false,
          message: 'Invalid categories format'
        });
      }
    }
    
    if (req.body.tags && typeof req.body.tags === 'string') {
      try {
        req.body.tags = JSON.parse(req.body.tags);
      } catch (err) {
        console.error('Error parsing tags:', err);
        return res.status(400).json({
          success: false,
          message: 'Invalid tags format'
        });
      }
    }
    
    // Validate content if it's provided
    if (req.body.content && req.body.content.replace(/<[^>]*>/g, '').trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Content cannot be empty'
      });
    }

    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Make sure user is the blog owner
    if (blog.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }

    // Update only the provided fields (don't overwrite existing fields with undefined)
    const updateData = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.content) updateData.content = req.body.content;
    if (req.body.summary) updateData.summary = req.body.summary;
    if (req.body.categories) updateData.categories = req.body.categories;
    if (req.body.tags) updateData.tags = req.body.tags;
    if (req.body.coverImage) updateData.coverImage = req.body.coverImage;

    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Make sure user is the blog owner
    if (blog.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }

    await blog.remove();

    res.status(200).json({
      success: true,
      message: 'Blog removed'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add a reaction to a blog
// @route   PUT /api/blogs/:id/react
// @access  Private
exports.reactToBlog = async (req, res) => {
  try {
    const { type } = req.body;
    console.log(`Reaction request received: blog ${req.params.id}, type ${type}, user ${req.user.id}`);

    if (!['likes', 'hearts', 'claps'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Initialize reaction arrays if they don't exist
    if (!blog.reactionUsers) {
      blog.reactionUsers = { likes: [], hearts: [], claps: [] };
    }
    
    if (!blog.reactions) {
      blog.reactions = { likes: 0, hearts: 0, claps: 0 };
    }
    
    // Ensure the arrays exist for this reaction type
    if (!blog.reactionUsers[type]) {
      blog.reactionUsers[type] = [];
    }

    // Check if the user has already reacted
    const hasReacted = blog.reactionUsers[type].some(
      userId => userId.toString() === req.user.id
    );
    
    console.log(`User ${req.user.id} has ${hasReacted ? 'already' : 'not'} reacted with ${type}`);

    if (hasReacted) {
      // Remove user from reaction
      blog.reactions[type] = Math.max(0, blog.reactions[type] - 1);
      blog.reactionUsers[type] = blog.reactionUsers[type].filter(
        userId => userId.toString() !== req.user.id
      );
      console.log(`Removed reaction ${type}, count now: ${blog.reactions[type]}`);
    } else {
      // Add user to reaction
      blog.reactions[type] += 1;
      blog.reactionUsers[type].push(req.user.id);
      console.log(`Added reaction ${type}, count now: ${blog.reactions[type]}`);
    }

    await blog.save();
    console.log(`Saved blog reactions: ${JSON.stringify(blog.reactions)}`);

    res.status(200).json({
      success: true,
      data: blog.reactions,
      hasReacted: !hasReacted
    });
  } catch (error) {
    console.error('React to blog error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get blogs by user
// @route   GET /api/users/blogs/:userId
// @access  Public
exports.getBlogsByUser = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.userId })
      .sort('-createdAt')
      .populate({
        path: 'author',
        select: 'name avatar'
      });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 