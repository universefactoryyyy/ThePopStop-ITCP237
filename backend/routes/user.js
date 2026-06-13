const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { registerUser, loginUser, getProfile, updateProfile, getAllUsers, updateUserRole, deactivateUser } = require('../controllers/user');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.post('/register', upload.single('image'), registerUser);
router.post('/login', loginUser);
router.get('/profile', isAuthenticatedUser, getProfile);
router.put('/profile', isAuthenticatedUser, upload.single('image'), updateProfile);
router.get('/users', isAdmin, getAllUsers);
router.put('/users/:id/role', isAdmin, updateUserRole);
router.put('/users/:id/status', isAdmin, deactivateUser);

module.exports = router;
