const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const blogRoutes = require('./routes/blogs');
const commentRoutes = require('./routes/comments');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// 📁 Ensure uploads and blogs subdirectory exist BEFORE anything else
const uploadsDir = path.join(__dirname, 'uploads');
const blogUploadsDir = path.join(uploadsDir, 'blogs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadsDir);
}
if (!fs.existsSync(blogUploadsDir)) {
  fs.mkdirSync(blogUploadsDir, { recursive: true });
  console.log('✅ Created blog uploads directory:', blogUploadsDir);
}

// 🧪 Now it's safe to read contents
console.log('Uploads directory path:', uploadsDir);
try {
  console.log('Files in uploads directory:', fs.readdirSync(uploadsDir));
  console.log('Files in blogs directory:', fs.readdirSync(blogUploadsDir));
} catch (err) {
  console.warn('⚠️ Failed to read upload directories:', err.message);
}

// 📦 Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

// 📜 File type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, and WebP are allowed.'), false);
  }
};

// 🧱 Setup multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// 🧩 Middleware
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));




const allowedOrigins = [
  'https://my-blog-beta-five.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Not Allowed: ' + origin));
    }
  },
  credentials: true,
}));

// 🔥 Handle OPTIONS preflight
app.options('*', cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Not Allowed: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(morgan('dev'));

// 🔗 Serve uploads statically
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', (req, res, next) => {
  const fullPath = path.join(uploadsDir, req.url);
  console.log(`Static file requested: ${req.url}`);
  console.log(`File exists: ${fs.existsSync(fullPath)}`);
  next();
});




// 🔁 Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/comments', commentRoutes);

// 🏠 Root route
app.get('/', (req, res) => {
  res.send('Welcome to Blog API');
});

// 🔌 DB Connection
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    app.listen(PORT, () => console.log(`🚀 Server running on port: ${PORT}`));
  })
  .catch((error) => console.log(`❌ MongoDB connection error: ${error}`));
