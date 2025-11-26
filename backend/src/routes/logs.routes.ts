import { Router, Request, Response } from 'express';
import { logStore } from '../services/logStore';

const router = Router();

// GET /api/logs - Get all backend logs
router.get('/', (req: Request, res: Response) => {
  try {
    const logs = logStore.getAllLogs();
    res.status(200).json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch logs',
    });
  }
});

// DELETE /api/logs - Clear all logs
router.delete('/', (req: Request, res: Response) => {
  try {
    logStore.clearLogs();
    res.status(200).json({
      success: true,
      message: 'Logs cleared',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear logs',
    });
  }
});

export default router;

