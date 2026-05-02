import type { Request, Response } from "express";
import prisma from "../config/db.js";
import { activityLogger } from "../utils/activityLogger.js";

export const validateId = (id: string | string[] | undefined): string => {
  if (!id || Array.isArray(id)) {
    throw new Error("Invalid ID format");
  }
  return id;
};

export const projectController = {
  // Get all projects for current user
  async getUserProjects(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      let projects;

      if (userRole === "admin") {
        // Admin sees all projects
        projects = await prisma.project.findMany({
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            tasks: {
              select: {
                id: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      } else {
        // Regular user sees only their projects
        projects = await prisma.project.findMany({
          where: {
            members: {
              some: { userId },
            },
          },
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
              take: 5, // Limit members preview
            },
            tasks: {
              select: {
                id: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      }

      // Add computed stats
      const projectsWithStats = projects.map((project) => ({
        ...project,
        stats: {
          totalTasks: project.tasks.length,
          completedTasks: project.tasks.filter((t) => t.status === "done")
            .length,
          inProgressTasks: project.tasks.filter(
            (t) => t.status === "in_progress"
          ).length,
          todoTasks: project.tasks.filter((t) => t.status === "todo").length,
        },
      }));

      res.json({ projects: projectsWithStats });
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Get single project by ID
  async getProjectById(req: Request, res: Response) {
    try {
      let { id } = req.params;
      id = validateId(id);
      const userId = req.user!.id;

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true },
              },
              creator: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      // Check access (admin or member)
      const isMember = project.members.some((m) => m.userId === userId);
      const isAdmin = req.user!.role === "admin";

      if (!isMember && !isAdmin) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      // Get user's role in this project
      const userMembership = project.members.find((m) => m.userId === userId);
      const userProjectRole =
        userMembership?.role || (isAdmin ? "admin" : null);

      res.json({
        project,
        userRole: userProjectRole,
      });
    } catch (error) {
      console.error("Get project error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Create new project
  async createProject(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      const userId = req.user!.id;

      if (!name || name.trim().length === 0) {
        res.status(400).json({ error: "Project name is required" });
        return;
      }

      // Create project
      const project = await prisma.project.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          createdBy: userId,
          members: {
            create: {
              userId,
              role: "admin", // Creator is admin
            },
          },
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      // Log activity
      await activityLogger.projectCreated(userId, project.id, project.name);

      res.status(201).json({
        message: "Project created successfully",
        project,
      });
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Update project
  async updateProject(req: Request, res: Response) {
    try {
      let { id } = req.params;
      id = validateId(id);
      const { name, description } = req.body;
      const userId = req.user!.id;

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      });

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      // Check if user is admin of project or global admin
      const userMembership = project.members[0];
      const isAdmin =
        req.user!.role === "admin" || userMembership?.role === "admin";

      if (!isAdmin) {
        res
          .status(403)
          .json({ error: "Only project admins can update project" });
        return;
      }

      const changes: string[] = [];
      if (name && name !== project.name) changes.push("name");
      if (description !== undefined && description !== project.description)
        changes.push("description");

      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          name: name?.trim(),
          description: description?.trim(),
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (changes.length > 0) {
        await activityLogger.projectUpdated(userId, id, changes);
      }

      res.json({
        message: "Project updated successfully",
        project: updatedProject,
      });
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Delete project
  async deleteProject(req: Request, res: Response) {
    try {
      let { id } = req.params;
      id = validateId(id);
      const userId = req.user!.id;

      const project = await prisma.project.findUnique({
        where: { id },
        select: { name: true, createdBy: true },
      });

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      // Only creator or global admin can delete
      const isCreator = project.createdBy === userId;
      const isGlobalAdmin = req.user!.role === "admin";

      if (!isCreator && !isGlobalAdmin) {
        res.status(403).json({
          error: "Only project creator or global admin can delete project",
        });
        return;
      }

      await prisma.project.delete({
        where: { id },
      });

      await activityLogger.projectDeleted(userId, id, project.name);

      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Add member to project
  async addMember(req: Request, res: Response) {
    try {
      let { id } = req.params;
      id = validateId(id);
      const { email, role = "member" } = req.body;
      const userId = req.user!.id;

      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }

      // Find user by email
      const userToAdd = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      });

      if (!userToAdd) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Check if already a member
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: id,
            userId: userToAdd.id,
          },
        },
      });

      if (existingMember) {
        res
          .status(409)
          .json({ error: "User is already a member of this project" });
        return;
      }

      // Add member
      const member = await prisma.projectMember.create({
        data: {
          projectId: id,
          userId: userToAdd.id,
          role: role === "admin" ? "admin" : "member",
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await activityLogger.memberAdded(userId, id, userToAdd.email, role);

      res.status(201).json({
        message: "Member added successfully",
        member,
      });
    } catch (error) {
      console.error("Add member error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Remove member from project
  async removeMember(req: Request, res: Response) {
    try {
      let { id, memberId } = req.params;
      id = validateId(id);
      memberId = validateId(memberId);
      const userId = req.user!.id;

      // Cannot remove yourself if you're the only admin
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: {
            where: { role: "admin" },
            select: { userId: true },
          },
        },
      });

      const adminCount = project?.members.length || 0;
      const isRemovingSelf = memberId === userId;

      if (isRemovingSelf && adminCount === 1) {
        res
          .status(400)
          .json({ error: "Cannot remove yourself as you are the only admin" });
        return;
      }

      await prisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: id,
            userId: memberId,
          },
        },
      });

      const removedUser = await prisma.user.findUnique({
        where: { id: memberId },
        select: { email: true },
      });

      if (removedUser) {
        await activityLogger.memberRemoved(userId, id, removedUser.email);
      }

      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Remove member error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Get project members
  async getProjectMembers(req: Request, res: Response) {
    try {
      let { id } = req.params;
      id = validateId(id);

      const members = await prisma.projectMember.findMany({
        where: { projectId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });

      res.json({ members });
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
