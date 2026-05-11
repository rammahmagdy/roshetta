import { Router } from 'express';
import { getDrugSearch, postDrugLookup } from '../controllers/drugs-controller.js';

export const drugsRouter = Router();

drugsRouter.get('/search', getDrugSearch);
drugsRouter.post('/lookup', postDrugLookup);
