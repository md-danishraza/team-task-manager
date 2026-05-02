import prisma from "../config/db.js";

export type ActivityAction =
  | "create_project"
  | "update_project"
  | "delete_project"
  | "add_member"
  | "remove_member"
  | "create_task"
  | "update_task"
  | "delete_task"
  | "assign_task"
  | "update_task_status"
  | "update_task_priority";

interface ActivityDetails {
  projectId?: string;
  taskId?: string;
  userId?: string;
  oldValue?: string;
  newValue?: string;
  [key: string]: any;
}

export async function logActivity(
  userId: string,
  action: ActivityAction,
  details: ActivityDetails
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details as any, // Prisma Json type
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - activity logging shouldn't break main flow
  }
}

// Convenience methods
export const activityLogger = {
  async projectCreated(userId: string, projectId: string, projectName: string) {
    await logActivity(userId, "create_project", {
      projectId,
      projectName,
      action: "created new project",
    });
  },

  async projectUpdated(userId: string, projectId: string, changes: string[]) {
    await logActivity(userId, "update_project", {
      projectId,
      changes: changes.join(", "),
      action: "updated project details",
    });
  },

  async projectDeleted(userId: string, projectId: string, projectName: string) {
    await logActivity(userId, "delete_project", {
      projectId,
      projectName,
      action: "deleted project",
    });
  },

  async memberAdded(
    userId: string,
    projectId: string,
    memberEmail: string,
    role: string
  ) {
    await logActivity(userId, "add_member", {
      projectId,
      memberEmail,
      role,
      action: `added ${memberEmail} as ${role}`,
    });
  },

  async memberRemoved(userId: string, projectId: string, memberEmail: string) {
    await logActivity(userId, "remove_member", {
      projectId,
      memberEmail,
      action: `removed ${memberEmail} from project`,
    });
  },

  async taskCreated(
    userId: string,
    projectId: string,
    taskId: string,
    taskTitle: string
  ) {
    await logActivity(userId, "create_task", {
      projectId,
      taskId,
      taskTitle,
      action: `created task: ${taskTitle}`,
    });
  },

  async taskAssigned(userId: string, taskId: string, assignedToEmail: string) {
    await logActivity(userId, "assign_task", {
      taskId,
      assignedTo: assignedToEmail,
      action: `assigned task to ${assignedToEmail}`,
    });
  },

  async taskStatusChanged(
    userId: string,
    taskId: string,
    oldStatus: string,
    newStatus: string
  ) {
    await logActivity(userId, "update_task_status", {
      taskId,
      oldStatus,
      newStatus,
      action: `changed task status from ${oldStatus} to ${newStatus}`,
    });
  },

  async taskUpdated(userId: string, taskId: string, updates: string[]) {
    await logActivity(userId, "update_task", {
      taskId,
      updates: updates.join(", "),
      action: `updated task: ${updates.join(", ")}`,
    });
  },
};
