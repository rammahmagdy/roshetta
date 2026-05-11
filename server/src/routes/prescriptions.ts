import { Router } from 'express';
import { uploadImage } from '../middleware/upload.js';
import { getGeo, getHealth, postPrescription } from '../controllers/prescriptions-controller.js';

export const apiRouter = Router();

apiRouter.get('/health', getHealth);
apiRouter.get('/geo', getGeo);
apiRouter.post('/prescriptions', uploadImage, postPrescription);
