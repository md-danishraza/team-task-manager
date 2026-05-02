import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Team Task Manager API",
      version: "1.0.0",
      description: `
        A comprehensive task management system with role-based access control.
        
        ## Features
        - 🔐 JWT Authentication 
        - 👥 User roles (Admin/Member)
        - 📋 Project management
        - ✅ Task tracking
        - 📊 Activity logging
        - 🎯 Role-based access control
        
        ## Authentication
        This API uses httpOnly cookies for authentication. After login/signup,
        the token is automatically stored in cookies and sent with every request.
        
        ## Roles
        - **Admin**: Global access, can manage all projects and users
        - **Member**: Regular user with project-specific permissions
      `,
      contact: {
        name: "API Support",
        email: "support@taskmanager.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development Server",
      },
      {
        url: process.env.API_URL || "https://api.taskmanager.com/api",
        description: "Production Server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token stored in httpOnly cookie",
        },
      },
      schemas: {
        // User Schemas
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            name: { type: "string", example: "John Doe" },
            role: {
              type: "string",
              enum: ["admin", "member"],
              example: "member",
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        SignupInput: {
          type: "object",
          required: ["email", "name", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            name: {
              type: "string",
              minLength: 2,
              maxLength: 50,
              example: "John Doe",
            },
            password: { type: "string", minLength: 6, example: "password123" },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", example: "password123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },

        // Project Schemas
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            createdBy: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateProjectInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              example: "E-commerce Platform",
            },
            description: {
              type: "string",
              maxLength: 500,
              example: "Build a modern e-commerce platform",
            },
          },
        },

        Task: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            status: { type: "string", enum: ["todo", "in_progress", "done"] },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            dueDate: { type: "string", format: "date-time", nullable: true },
            projectId: { type: "string", format: "uuid" },
            assignedTo: { type: "string", format: "uuid", nullable: true },
            createdBy: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            project: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
              },
            },
            assignee: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                email: { type: "string", format: "email" },
              },
            },
            creator: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                email: { type: "string", format: "email" },
              },
            },
          },
        },
        CreateTaskInput: {
          type: "object",
          required: ["title", "projectId"],
          properties: {
            title: { type: "string", minLength: 1, maxLength: 200 },
            description: { type: "string", maxLength: 1000 },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              default: "medium",
            },
            dueDate: { type: "string", format: "date-time" },
            projectId: { type: "string", format: "uuid" },
            assignedTo: { type: "string", format: "uuid", nullable: true },
          },
        },
        UpdateTaskStatusInput: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["todo", "in_progress", "done"] },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { error: "Authentication required" },
            },
          },
        },
        ForbiddenError: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { error: "Admin access required" },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { error: "Project not found" },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { error: "Email and password are required" },
            },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
    tags: [
      { name: "Health", description: "API health check endpoints" },
      { name: "Authentication", description: "User authentication endpoints" },
      { name: "Projects", description: "Project management endpoints" },
      { name: "Tasks", description: "Task management endpoints" },
      { name: "Dashboard", description: "Dashboard and statistics endpoints" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/index.ts"], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
