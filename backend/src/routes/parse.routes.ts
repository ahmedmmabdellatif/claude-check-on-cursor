import { Router } from 'express';
import multer from 'multer';
import { parseController } from '../controllers/parse.controller';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// POST /api/parse - Upload PDF and create async job
// Returns: { jobId, status: "pending" }
router.post('/', upload.single('pdf'), async (req, res, next) => {
  try {
    await parseController.parsePdf(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/parse/:jobId/status - Get job status
// Returns: { jobId, status, progress, result?, error? }
router.get('/:jobId/status', async (req, res, next) => {
  try {
    await parseController.getJobStatus(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
