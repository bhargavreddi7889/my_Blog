const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  reactToBlog
} = require('../controllers/blogs');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.get('/test', (req, res) => {
  res.json({ message: '✅ Blog routes working!' });
});


// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../uploads/blogs/');
    
    console.log('Upload path for blogs:', uploadPath);
    
    // Check if directory exists, if not create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Created uploads directory for blogs:', uploadPath);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname);
    const filename = `blog-${uuidv4()}${ext}`;
    console.log('Generated filename:', filename);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// Process file upload
const processFileUpload = (req, res, next) => {
  if (req.file) {
    // Set the coverImage path in the request body using web path format (with forward slashes)
    const relativePath = `/uploads/blogs/${req.file.filename}`;
    req.body.coverImage = relativePath.replace(/\\/g, '/');
    console.log('Saved coverImage path:', req.body.coverImage);
    console.log('Original file path:', req.file.path);
  } else {
    console.log('No file uploaded');
  }
  next();
};

// Public routes
router.get('/', getBlogs);
router.get('/:id', getBlog);

// Protected routes
router.post(
  '/',
  [
    protect,
    upload.single('coverImage'), // Process file upload
    processFileUpload, // Process file upload before validation
    [
      check('title', 'Title is required').not().isEmpty(),
      check('content', 'Content is required').not().isEmpty()
    ]
  ],
  createBlog
);

router.put(
  '/:id',
  [
    protect,
    upload.single('coverImage'), // Process file upload
    processFileUpload, // Process file upload before validation
    [
      check('title', 'Title is required').optional().not().isEmpty(),
      check('content', 'Content is required').optional().not().isEmpty()
    ]
  ],
  updateBlog
);

router.delete('/:id', protect, deleteBlog);

// Reaction route
router.put(
  '/:id/react',
  [
    protect,
    [check('type', 'Reaction type is required').not().isEmpty()]
  ],
  reactToBlog
);

module.exports = router; 