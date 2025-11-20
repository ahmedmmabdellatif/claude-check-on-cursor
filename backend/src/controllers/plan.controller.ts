import { Request, Response } from 'express';
import { db } from '../db/sqlite-client';

export class PlanController {
  getPlan(req: Request, res: Response): void {
    try {
      const { id } = req.params;

      const plan = db.prepare('SELECT * FROM ParsedPlan WHERE id = ?').get(id) as any;

      if (!plan) {
        res.status(404).json({ error: 'Plan not found' });
        return;
      }

      let fitnessPlan = {};
      try {
        fitnessPlan = JSON.parse(plan.rawJson);
      } catch (e) {
        console.error('Failed to parse rawJson from DB', e);
      }

      res.json({
        planId: plan.id,
        fitnessPlan: fitnessPlan,
        status: plan.status,
        createdAt: plan.createdAt
      });
    } catch (error) {
      console.error('[PlanController] Error fetching plan:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  getPlanDebug(req: Request, res: Response): void {
    try {
      const { id } = req.params;

      const plan = db.prepare('SELECT debugJson FROM ParsedPlan WHERE id = ?').get(id) as any;

      if (!plan) {
        res.status(404).json({ error: 'Plan not found' });
        return;
      }

      let debug = {};
      try {
        debug = JSON.parse(plan.debugJson);
      } catch (e) {
        console.error('Failed to parse debugJson from DB', e);
      }

      res.json({
        debug: debug
      });
    } catch (error) {
      console.error('[PlanController] Error fetching plan debug:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const planController = new PlanController();
