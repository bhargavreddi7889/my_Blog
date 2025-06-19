const express = require('express');
const { check } = require('express-validator');
const {
  getCommentsByBlog,
  addComment,
  updateComment,
  deleteComment,
  likeComment
} = require('../controllers/comments');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get comments for a blog
router.get('/blog/:blogId', getCommentsByBlog);

// Add comment to a blog
router.post(
  '/blog/:blogId',
  [
    protect,
    [
      check('content', 'Comment content is required').not().isEmpty()
    ]
  ],
  addComment
);

// Update comment
router.put(
  '/:id',
  [
    protect,
    [
      check('content', 'Comment content is required').not().isEmpty()
    ]
  ],
  updateComment
);

// Delete comment
router.delete('/:id', protect, deleteComment);

// Like comment
router.put('/:id/like', protect, likeComment);

module.exports = router; 