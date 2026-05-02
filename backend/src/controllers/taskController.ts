import type { Request, Response } from "express";
import prisma from "../config/db.js";
import { activityLogger } from "../utils/activityLogger.js";
import { validateId } from "./projectController.js";

export const taskController = {
  // Get tasks with filtering
  async getTasks(req: Request, res: Response) {
    try {
      const { projectId, status, priority, assignedTo } = req.query;
      const userId = req.user!.id;

      const where: any = {};

      if (projectId) where.projectId = projectId as string;
      if (status) where.status = status as string;
      if (priority) where.priority = priority as string;
      if (assignedTo) where.assignedTo = assignedTo as string;

      // If no project specified, get tasks from all user's projects
      if (!projectId) {
        const userProjects = await prisma.projectMember.findMany({
          where: { userId },
          select: { projectId: true },
        });

        const projectIds = userProjects.map((p) => p.projectId);

        if (req.user!.role === "admin") {
          // Admin sees all tasks
          // Don't filter by project
        } else if (projectIds.length > 0) {
          where.projectId = { in: projectIds };
        } else {
          res.json({ tasks: [] });
          return;
        }
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [
          { dueDate: "asc" },
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      });

      res.json({ tasks });
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Get single task
  async getTaskById(req: Request, res: Response) {
    try {
      let { id } = req.params;
      id = validateId(id);

      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            select: { id: true, name: true, description: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      res.json({ task });
    } catch (error) {
      console.error("Get task error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Create task
  async createTask(req: Request, res: Response) {
    try {
      const { title, description, priority, dueDate, projectId, assignedTo } =
        req.body;
      const userId = req.user!.id;

      if (!title || !projectId) {
        res.status(400).json({ error: "Title and project ID are required" });
        return;
      }

      // Check if user has access to project
      const projectAccess = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      const isGlobalAdmin = req.user!.role === "admin";

      if (!projectAccess && !isGlobalAdmin) {
        res
          .status(403)
          .json({ error: "You do not have access to this project" });
        return;
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          description: description?.trim(),
          priority: priority || "medium",
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId,
          assignedTo: assignedTo || null,
          createdBy: userId,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      });

      await activityLogger.taskCreated(userId, projectId, task.id, task.title);

      if (assignedTo) {
        const assignee = await prisma.user.findUnique({
          where: { id: assignedTo },
          select: { email: true },
        });
        if (assignee) {
          await activityLogger.taskAssigned(userId, task.id, assignee.email);
        }
      }

      res.status(201).json({
        message: "Task created successfully",
        task,
      });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Update task
  async updateTask(req: Request, res: Response) {
    try {
      let { id } = req.params;
      id = validateId(id);
      const { title, description, priority, dueDate, assignedTo } = req.body;
      const userId = req.user!.id;

      const existingTask = await prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              members: {
                where: { userId },
                select: { role: true },
              },
            },
          },
        },
      });

      if (!existingTask) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      // Check permissions
      const isAssignee = existingTask.assignedTo === userId;
      const isProjectAdmin = existingTask.project.members[0]?.role === "admin";
      const isGlobalAdmin = req.user!.role === "admin";
      const isCreator = existingTask.createdBy === userId;

      if (!isAssignee && !isProjectAdmin && !isGlobalAdmin && !isCreator) {
        res
          .status(403)
          .json({ error: "You do not have permission to update this task" });
        return;
      }

      const changes: string[] = [];
      if (title && title !== existingTask.title) changes.push("title");
      if (description !== undefined && description !== existingTask.description)
        changes.push("description");
      if (priority && priority !== existingTask.priority)
        changes.push("priority");
      if (
        dueDate !== undefined &&
        dueDate !== existingTask.dueDate?.toISOString()
      )
        changes.push("due date");
      if (assignedTo && assignedTo !== existingTask.assignedTo)
        changes.push("assignee");

      const task = await prisma.task.update({
        where: { id },
        data: {
          title: title?.trim(),
          description: description?.trim(),
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          assignedTo: assignedTo || null,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      });

      if (changes.length > 0) {
        await activityLogger.taskUpdated(userId, id, changes);
      }

      if (assignedTo && assignedTo !== existingTask.assignedTo) {
        const assignee = await prisma.user.findUnique({
          where: { id: assignedTo },
          select: { email: true },
        });
        if (assignee) {
          await activityLogger.taskAssigned(userId, id, assignee.email);
        }
      }

      res.json({
        message: "Task updated successfully",
        task,
      });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Update task status (specialized endpoint)
  async updateTaskStatus(req: Request, res: Response) {
    try {
      let { id } = req.params;
      id = validateId(id);
      const { status } = req.body;
      const userId = req.user!.id;

      if (!status || !["todo", "in_progress", "done"].includes(status)) {
        res.status(400).json({ error: "Valid status is required" });
        return;
      }

      const existingTask = await prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              members: {
                where: { userId },
                select: { role: true },
              },
            },
          },
        },
      });

      if (!existingTask) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      // Check permissions
      const isAssignee = existingTask.assignedTo === userId;
      const isProjectAdmin = existingTask.project.members[0]?.role === "admin";
      const isGlobalAdmin = req.user!.role === "admin";

      if (!isAssignee && !isProjectAdmin && !isGlobalAdmin) {
        res
          .status(403)
          .json({ error: "You do not have permission to update task status" });
        return;
      }

      const oldStatus = existingTask.status;

      const task = await prisma.task.update({
        where: { id },
        data: { status },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      });

      await activityLogger.taskStatusChanged(userId, id, oldStatus, status);

      res.json({
        message: "Task status updated successfully",
        task,
      });
    } catch (error) {
      console.error("Update task status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Delete task
  async deleteTask(req: Request, res: Response) {
    try {
      let { id } = req.params;
      id = validateId(id);

      const userId = req.user!.id;

      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              members: {
                where: { userId },
                select: { role: true },
              },
            },
          },
        },
      });

      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      // Check permissions (project admin or task creator or global admin)
      const isProjectAdmin = task.project.members[0]?.role === "admin";
      const isCreator = task.createdBy === userId;
      const isGlobalAdmin = req.user!.role === "admin";

      if (!isProjectAdmin && !isCreator && !isGlobalAdmin) {
        res
          .status(403)
          .json({ error: "You do not have permission to delete this task" });
        return;
      }

      await prisma.task.delete({
        where: { id },
      });

      await activityLogger.taskUpdated(userId, id, ["deleted"]);

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
