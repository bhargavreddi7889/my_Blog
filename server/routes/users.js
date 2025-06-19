const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { 
  getUsers, 
  getUser, 
  updateProfile, 
  deleteAccount,
  getUserActivity,
  getUserStats,
  getSavedBlogs,
  saveBlog,
  unsaveBlog
} = require('../controllers/users');
const { protect } = require('../middleware/auth');
const { getBlogsByUser } = require('../controllers/blogs');

const router = express.Router();

// Configure avatar upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../uploads/');
    
    console.log('Avatar upload path:', uploadPath);
    
    // Check if directory exists, if not create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Created uploads directory for avatars:', uploadPath);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname);
    const filename = `avatar-${uuidv4()}${ext}`;
    console.log('Generated avatar filename:', filename);
    cb(null, filename);
  }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, and WebP are allowed.'), false);
  }
};

// Setup multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter
});

// Public routes
router.get('/', getUsers);

// Get blogs by specific user
router.get('/blogs/:userId', getBlogsByUser);

// Get user profile
router.get('/profile/:id', getUser);

// Protected routes
router.put(
  '/update-profile',
  [
    protect,
    upload.single('avatar'),
    [
      check('name', 'Name is required').optional(),
      check('bio', 'Bio cannot exceed 500 characters').optional().isLength({ max: 500 })
    ]
  ],
  updateProfile
);

// Get user activity (blogs, comments, reactions)
router.get('/activity', protect, getUserActivity);

// Get user stats (blog counts, comment counts, reaction counts)
router.get('/stats', protect, getUserStats);

// Saved blogs routes
router.get('/saved-blogs', protect, getSavedBlogs);
router.post('/saved-blogs/:blogId', protect, saveBlog);
router.delete('/saved-blogs/:blogId', protect, unsaveBlog);

// Delete account
router.delete('/me', protect, deleteAccount);

// This route needs to be last as it's the most generic
router.get('/:id', getUser);

module.exports = router; 