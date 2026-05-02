import { Router } from "express";
import { activityController } from "../controllers/activityController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkProjectAccess } from "../middleware/projectMiddleware.js";

const router = Router();

// All activity routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /activities/me:
 *   get:
 *     summary: Get current user's activity feed
 *     tags: [Activities]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's recent activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       action:
 *                         type: string
 *                         enum:
 *                           - create_project
 *                           - update_project
 *                           - delete_project
 *                           - add_member
 *                           - remove_member
 *                           - create_task
 *                           - update_task
 *                           - delete_task
 *                           - assign_task
 *                           - update_task_status
 *                           - update_task_priority
 *                       details:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/me", activityController.getUserActivity);

/**
 * @swagger
 * /activities/projects/{projectId}:
 *   get:
 *     summary: Get activity feed for a specific project
 *     tags: [Activities]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID to get activities for
 *     responses:
 *       200:
 *         description: Project's recent activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       action:
 *                         type: string
 *                       details:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No access to this project
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/projects/:projectId",
  checkProjectAccess,
  activityController.getProjectActivity
);

/**
 * @swagger
 * /activities/all:
 *   get:
 *     summary: Get global activity feed (Admin only)
 *     tags: [Activities]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of activities to return
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: Global activity feed (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       action:
 *                         type: string
 *                       details:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                 count:
 *                   type: integer
 *                 filters:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 */
router.get("/all", activityController.getAllActivity);

export default router;
