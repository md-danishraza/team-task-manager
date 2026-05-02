import type { Request, Response, NextFunction } from "express";
import prisma from "../config/db.js";

// Extend Request type to include project role
declare global {
  namespace Express {
    interface Request {
      projectRole?: "admin" | "member" | null;
      projectId?: string;
    }
  }
}

/**
 * Check if user has access to project and get their role
 * Use this for any project-specific route
 */

export async function checkProjectAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Try to get projectId from multiple possible locations
    const projectId =
      req.params.projectId || // For routes like /projects/:projectId
      req.params.id || // For routes like /projects/:id/members
      req.body.projectId; // For request body

    console.log("Project access check - params:", req.params);
    console.log("Project access check - projectId:", projectId);

    if (!projectId) {
      res.status(400).json({ error: "Project ID is required" });
      return;
    }

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Check if user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    // Also check if user is global admin (they get access to everything)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!membership && user?.role !== "admin") {
      res.status(403).json({ error: "You do not have access to this project" });
      return;
    }

    // Store project info in request
    req.projectId = projectId;
    req.projectRole =
      membership?.role || (user?.role === "admin" ? "admin" : null);

    next();
  } catch (error) {
    console.error("Project access check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Check if user is admin of the project (or global admin)
 */
export function requireProjectAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.projectRole !== "admin") {
    res.status(403).json({ error: "Project admin access required" });
    return;
  }
  next();
}
