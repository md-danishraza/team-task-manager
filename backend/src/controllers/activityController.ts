import type { Request, Response } from "express";
import prisma from "../config/db.js";
import { validateId } from "./projectController.js";

export const activityController = {
  async getProjectActivity(req: Request, res: Response) {
    try {
      let { projectId } = req.params;
      projectId = validateId(projectId);

      const activities = await prisma.activityLog.findMany({
        where: {
          details: {
            path: ["projectId"],
            equals: projectId,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      res.json({ activities });
    } catch (error) {
      console.error("Get project activity error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async getUserActivity(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const activities = await prisma.activityLog.findMany({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      res.json({ activities });
    } catch (error) {
      console.error("Get user activity error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async getAllActivity(req: Request, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const { limit = 100, action, userId } = req.query;

      const where: any = {};
      if (action) where.action = action as string;
      if (userId) where.userId = userId as string;

      const activities = await prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit as string) || 100,
      });

      res.json({
        activities,
        count: activities.length,
        filters: { action, userId },
      });
    } catch (error) {
      console.error("Get all activity error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
