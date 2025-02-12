import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { deleteNotifications, getNoficications } from '../controllers/notification.controller.js';

const router=express.Router();

router.get('/',protectRoute,getNoficications);
router.delete('/',protectRoute,deleteNotifications);

export default router;