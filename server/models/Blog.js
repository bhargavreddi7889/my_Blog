const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    content: {
      type: String,
      required: [true, 'Please provide content for the blog'],
    },
    summary: {
      type: String,
      maxlength: [200, 'Summary cannot be more than 200 characters']
    },
    coverImage: {
      type: String,
      default: 'default-blog.jpg'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    categories: {
      type: [String],
      default: ['General']
    },
    tags: [String],
    reactions: {
      likes: {
        type: Number,
        default: 0
      },
      hearts: {
        type: Number,
        default: 0
      },
      claps: {
        type: Number,
        default: 0
      }
    },
    reactionUsers: {
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      hearts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      claps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    views: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Cascade delete comments when a blog is deleted
BlogSchema.pre('remove', async function(next) {
  await this.model('Comment').deleteMany({ blog: this._id });
  next();
});

// Reverse populate with virtuals
BlogSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'blog',
  justOne: false
});

module.exports = mongoose.model('Blog', BlogSchema); 