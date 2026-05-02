import { Router } from "express";
import { projectController } from "../controllers/projectController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  checkProjectAccess,
  requireProjectAdmin,
} from "../middleware/projectMiddleware.js";

const router = Router();

// All project routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects for current user
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of projects with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Project'
 *                       - type: object
 *                         properties:
 *                           stats:
 *                             type: object
 *                             properties:
 *                               totalTasks:
 *                                 type: integer
 *                               completedTasks:
 *                                 type: integer
 *                               inProgressTasks:
 *                                 type: integer
 *                               todoTasks:
 *                                 type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", projectController.getUserProjects);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "E-commerce Platform"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Build a modern e-commerce platform with React and Node.js"
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/", projectController.createProject);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project by ID with full details
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details with tasks and members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *                 userRole:
 *                   type: string
 *                   enum: [admin, member]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied to this project
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id", checkProjectAccess, projectController.getProjectById);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update project details
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only project admins can update project
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id",
  checkProjectAccess,
  requireProjectAdmin,
  projectController.updateProject
);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only project creator or global admin can delete project
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete("/:id", checkProjectAccess, projectController.deleteProject);

/**
 * @swagger
 * /projects/{id}/members:
 *   get:
 *     summary: Get all members of a project
 *     tags: [Project Members]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of project members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [admin, member]
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  "/:id/members",
  checkProjectAccess,
  projectController.getProjectMembers
);

/**
 * @swagger
 * /projects/{id}/members:
 *   post:
 *     summary: Add a member to the project
 *     tags: [Project Members]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 default: member
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         description: Email required or user not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only project admins can add members
 *       409:
 *         description: User is already a member
 */
router.post(
  "/:id/members",
  checkProjectAccess,
  requireProjectAdmin,
  projectController.addMember
);

/**
 * @swagger
 * /projects/{id}/members/{memberId}:
 *   delete:
 *     summary: Remove a member from the project
 *     tags: [Project Members]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       400:
 *         description: Cannot remove last admin
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only project admins can remove members
 *       404:
 *         description: Member not found
 */
router.delete(
  "/:id/members/:memberId",
  checkProjectAccess,
  requireProjectAdmin,
  projectController.removeMember
);

export default router;
