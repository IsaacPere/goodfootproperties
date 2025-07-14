const express = require('express');
const router = express.Router();
const multer = require('multer');

// Middleware
const authMiddleware = require('../middleware/auth');

// Controllers (to be implemented separately)
const adminController = require('../controllers/authController');

const propertyController = require('../controllers/propertyController');

const contactController = require('../controllers/contactController');
const authController = require('../controllers/authController');

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/properties/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// -------- AUTH --------
router.post('/login', adminController.login.bind(authController));
router.post('/verify', authMiddleware, authController.verifyToken.bind(authController))
router.post('/change-password', authMiddleware, adminController.changePassword.bind(authController));
router.post('/logout', authMiddleware, adminController.logout.bind(authController));

// -------- DASHBOARD STATS --------
router.get('/stats', authMiddleware, adminController.getDashboardStats);

// -------- PROPERTIES --------
router.get('/properties', authMiddleware, propertyController.getAll);
router.post('/properties', authMiddleware, upload.single('image'), propertyController.create);
router.put('/properties/:id', authMiddleware, upload.single('image'), propertyController.update);
router.delete('/properties/:id', authMiddleware, propertyController.delete);

// -------- MESSAGES --------
router.get('/messages', authMiddleware, contactController.getAll);
router.get('/messages/:id', authMiddleware, contactController.getById);
router.put('/messages/:id/status', authMiddleware, contactController.updateStatus);

// 404 fallback for unknown admin routes
router.use((req, res) => {
    res.status(404).json({ message: 'Admin route not found' });
});

module.exports = router;
