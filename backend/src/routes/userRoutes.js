import express from 'express';
import { registerUser, loginUser, logoutUser, getUser, updateUser, updatePassword, deleteUser  } from '../controllers/userController.js';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/register', upload.single('avatar'), registerUser);
router.post('/login', loginUser);
router.post('/logout', verifyJwt, logoutUser);
router.get('/get-user', verifyJwt, getUser);
router.put('/update-user', verifyJwt, upload.single('avatar'), updateUser);
router.put('/update-password', verifyJwt, updatePassword);
router.delete('/delete-user', verifyJwt, deleteUser);

export default router;  