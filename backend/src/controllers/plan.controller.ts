import { Request, Response } from 'express';
import { db } from '../db/sqlite-client';

export class PlanController {
  async listPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = db.prepare(`
        SELECT id, createdAt, sourceFilename, status, metaTitle, metaCoachName, metaDurationWeeks, pagesCount
        FROM ParsedPlan
        ORDER BY createdAt DESC
      `).all();

      res.status(200).json({
        plans,
        count: plans.length,
      });
    } catch (error) {
      console.error('[Plan Controller] Error listing plans:', error);
      res.status(500).json({
        error: 'Failed to list plans',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getPlanById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const plan = db.prepare('SELECT * FROM ParsedPlan WHERE id = ?').get(id) as any;

      if (!plan) {
        res.status(404).json({ error: 'Plan not found' });
        return;
      }

      const mediaAssets = db.prepare('SELECT * FROM MediaAsset WHERE planId = ?').all(id);

      // Parse JSON strings back to objects
      const rawJson = JSON.parse(plan.rawJson);
      const debugJson = JSON.parse(plan.debugJson);

      res.status(200).json({
        id: plan.id,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        sourceFilename: plan.sourceFilename,
        pagesCount: plan.pagesCount,
        status: plan.status,
        meta: {
          title: plan.metaTitle,
          coachName: plan.metaCoachName,
          durationWeeks: plan.metaDurationWeeks,
        },
        data: rawJson,
        debug: debugJson,
        mediaAssets,
      });
    } catch (error) {
      console.error('[Plan Controller] Error fetching plan:', error);
      res.status(500).json({
        error: 'Failed to fetch plan',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getPlanDebug(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const plan = db.prepare(`
        SELECT id, sourceFilename, pagesCount, debugJson
        FROM ParsedPlan
        WHERE id = ?
      `).get(id) as any;

      if (!plan) {
        res.status(404).json({ error: 'Plan not found' });
        return;
      }

      const debugJson = JSON.parse(plan.debugJson);

      res.status(200).json({
        id: plan.id,
        sourceFilename: plan.sourceFilename,
        pagesCount: plan.pagesCount,
        debug: debugJson,
      });
    } catch (error) {
      console.error('[Plan Controller] Error fetching plan debug:', error);
      res.status(500).json({
        error: 'Failed to fetch plan debug data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const planController = new PlanController();
