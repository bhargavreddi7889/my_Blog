const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Please provide content for the comment'],
      trim: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    reactions: {
      likes: {
        type: Number,
        default: 0
      }
    },
    reactionUsers: {
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }
  },
  { timestamps: true }
);

// Get all replies to a comment
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent',
  justOne: false
});

module.exports = mongoose.model('Comment', CommentSchema); 