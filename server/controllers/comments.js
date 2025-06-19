const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');

// @desc    Get comments for a blog
// @route   GET /api/comments/blog/:blogId
// @access  Public
exports.getCommentsByBlog = async (req, res) => {
  try {
    const comments = await Comment.find({ 
      blog: req.params.blogId,
      parent: null
    })
      .populate({
        path: 'user',
        select: 'name avatar'
      })
      .populate({
        path: 'replies',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add comment to a blog
// @route   POST /api/comments/blog/:blogId
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { content, parent } = req.body;

    // Check if blog exists
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Create comment
    const comment = await Comment.create({
      content,
      user: req.user.id,
      blog: req.params.blogId,
      parent: parent || null
    });

    // Get the populated comment
    const populatedComment = await Comment.findById(comment._id)
      .populate({
        path: 'user',
        select: 'name avatar'
      });

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { content } = req.body;

    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true, runValidators: true }
    ).populate({
      path: 'user',
      select: 'name avatar'
    });

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Delete all replies
    await Comment.deleteMany({ parent: comment._id });

    // Delete the comment
    await Comment.findByIdAndDelete(comment._id);

    res.status(200).json({
      success: true,
      message: 'Comment removed'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Like a comment
// @route   PUT /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if the comment has already been liked by this user
    const hasLiked = comment.reactionUsers.likes.includes(req.user.id);

    if (hasLiked) {
      // Unlike comment
      comment.reactions.likes -= 1;
      comment.reactionUsers.likes = comment.reactionUsers.likes.filter(
        userId => userId.toString() !== req.user.id
      );
    } else {
      // Like comment
      comment.reactions.likes += 1;
      comment.reactionUsers.likes.push(req.user.id);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      data: comment.reactions
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 