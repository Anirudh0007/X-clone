import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { commentOnPost, createPost, deletePost, getAllPosts, getFollowingPosts, getLikedPosts, getUserPosts, likeUnlikePost } from '../controllers/post.controllers.js';

const router=express.Router();

router.get('/all', protectRoute, getAllPosts);
router.get('/likes/:id',protectRoute,getLikedPosts);
router.post('/create',protectRoute,createPost);
router.post('/like/:id',protectRoute,likeUnlikePost);
router.delete('/:id',protectRoute,deletePost);
router.get('/following',protectRoute,getFollowingPosts)
router.post('/comment/:id',protectRoute,commentOnPost);
router.get('/user/:userName',protectRoute,getUserPosts);

export default router;