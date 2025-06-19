const User = require('../models/User');
const { validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    console.log('Update profile request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { name, bio } = req.body;
    const updateData = {};
    
    // Only update fields that were sent
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    
    // Handle avatar upload
    if (req.file) {
      console.log('Handling avatar upload:', req.file.filename);
      updateData.avatar = `/uploads/${req.file.filename}`;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('Updated user profile:', user);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/me
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    // @todo - remove user's blogs, comments, etc.
    
    await User.findByIdAndDelete(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user activity (blogs, comments, reactions)
// @route   GET /api/users/activity
// @access  Private
exports.getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const activities = [];
    
    console.log('Fetching activity for user:', userId);
    
    // Get blogs created by user
    const blogs = await Blog.find({ author: userId })
      .select('title createdAt')
      .sort('-createdAt')
      .limit(5);
    
    console.log(`Found ${blogs.length} blogs created by user`);
    
    blogs.forEach(blog => {
      activities.push({
        type: 'blog',
        action: 'created',
        blog: {
          _id: blog._id,
          title: blog.title
        },
        createdAt: blog.createdAt
      });
    });
    
    // Get comments by user
    const comments = await Comment.find({ user: userId })
      .select('content blog createdAt')
      .populate('blog', 'title')
      .sort('-createdAt')
      .limit(5);
    
    console.log(`Found ${comments.length} comments by user`);
    
    comments.forEach(comment => {
      if (comment.blog) {
        activities.push({
          type: 'comment',
          action: 'commented',
          blog: {
            _id: comment.blog._id,
            title: comment.blog.title
          },
          content: comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : ''),
          createdAt: comment.createdAt
        });
      }
    });
    
    // Get blogs the user has reacted to
    const reactedBlogs = await Blog.find({
      $or: [
        { 'reactionUsers.likes': userId },
        { 'reactionUsers.hearts': userId },
        { 'reactionUsers.claps': userId }
      ]
    })
      .select('title reactions reactionUsers createdAt')
      .sort('-createdAt')
      .limit(5);
    
    console.log(`Found ${reactedBlogs.length} blogs reacted to by user`);
    
    reactedBlogs.forEach(blog => {
      // Find which reaction(s) the user made
      const reactionTypes = [];
      if (blog.reactionUsers.likes.includes(userId)) reactionTypes.push('liked');
      if (blog.reactionUsers.hearts.includes(userId)) reactionTypes.push('loved');
      if (blog.reactionUsers.claps.includes(userId)) reactionTypes.push('clapped');
      
      reactionTypes.forEach(reactionType => {
        activities.push({
          type: 'reaction',
          action: reactionType,
          blog: {
            _id: blog._id,
            title: blog.title
          },
          createdAt: blog.createdAt
        });
      });
    });
    
    // Sort all activities by date
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`Returning ${activities.length} total activities`);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user stats (blog counts, comment counts, reaction counts)
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Fetching stats for user:', userId);
    
    // Count blogs created by user
    const totalBlogs = await Blog.countDocuments({ author: userId });
    
    // Count comments by user
    const totalComments = await Comment.countDocuments({ user: userId });
    
    // Count reactions received on user's blogs
    const userBlogs = await Blog.find({ author: userId });
    let totalLikes = 0;
    let totalHearts = 0;
    let totalClaps = 0;
    
    userBlogs.forEach(blog => {
      totalLikes += blog.reactions.likes || 0;
      totalHearts += blog.reactions.hearts || 0;
      totalClaps += blog.reactions.claps || 0;
    });
    
    const totalReactions = totalLikes + totalHearts + totalClaps;
    
    // Count reactions given by user
    const reactedBlogsCount = await Blog.countDocuments({
      $or: [
        { 'reactionUsers.likes': userId },
        { 'reactionUsers.hearts': userId },
        { 'reactionUsers.claps': userId }
      ]
    });
    
    console.log('User stats:', {
      totalBlogs,
      totalComments,
      totalReactions,
      totalLikes,
      reactedBlogsCount
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalBlogs,
        totalComments,
        totalReactions,
        totalLikes,
        reactedBlogsCount
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's saved blogs
// @route   GET /api/users/saved-blogs
// @access  Private
exports.getSavedBlogs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedBlogs',
      select: 'title summary coverImage author createdAt',
      populate: {
        path: 'author',
        select: 'name avatar'
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      count: user.savedBlogs.length,
      data: user.savedBlogs
    });
  } catch (error) {
    console.error('Error getting saved blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Save a blog
// @route   POST /api/users/saved-blogs/:blogId
// @access  Private
exports.saveBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    
    // Check if blog exists
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if blog is already saved by user
    const user = await User.findById(req.user.id);
    
    if (user.savedBlogs.includes(blogId)) {
      return res.status(400).json({
        success: false,
        message: 'Blog already saved'
      });
    }
    
    // Add blog to user's saved blogs
    user.savedBlogs.push(blogId);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Blog saved successfully'
    });
  } catch (error) {
    console.error('Error saving blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Unsave a blog
// @route   DELETE /api/users/saved-blogs/:blogId
// @access  Private
exports.unsaveBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    
    // Check if blog exists
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if blog is saved by user
    const user = await User.findById(req.user.id);
    
    if (!user.savedBlogs.includes(blogId)) {
      return res.status(400).json({
        success: false,
        message: 'Blog not saved'
      });
    }
    
    // Remove blog from user's saved blogs
    user.savedBlogs = user.savedBlogs.filter(
      savedBlogId => savedBlogId.toString() !== blogId
    );
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Blog removed from saved'
    });
  } catch (error) {
    console.error('Error unsaving blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 