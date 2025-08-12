import express from 'express';
import { 
  createInvitation,
  getInvitations,
  getInvitationById,
  validateInvitation,
  acceptInvitation,
  cancelInvitation,
  resendInvitation,
  deleteInvitationPermanently
} from '../controllers/invitationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Private routes (require authentication and authorization)
router.post('/', authenticate, authorize(['superAdmin', 'admin']), createInvitation);
router.get('/', authenticate, authorize(['superAdmin', 'admin']), getInvitations);
router.get('/:id', authenticate, authorize(['superAdmin', 'admin']), getInvitationById);
router.delete('/:id', authenticate, authorize(['superAdmin', 'admin']), cancelInvitation);
router.post('/:id/resend', authenticate, authorize(['superAdmin', 'admin']), resendInvitation);
router.delete('/:id/permanent', authenticate, authorize(['superAdmin', 'admin']), deleteInvitationPermanently);

// Public routes
router.get('/validate/:token', validateInvitation);
router.post('/accept/:token', acceptInvitation);

export default router; 