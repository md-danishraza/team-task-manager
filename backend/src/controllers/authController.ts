import type { Request, Response } from "express";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../utils/password.js";
import { generateToken, getCookieOptions } from "../utils/jwt.js";
import prisma from "../config/db.js";

export const authController = {
  async signup(req: Request, res: Response) {
    try {
      const { email, name, password } = req.body;

      // Validation
      if (!email || !name || !password) {
        res
          .status(400)
          .json({ error: "Email, name, and password are required" });
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      // Password strength validation
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({ error: passwordValidation.message });
        return;
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      // Hash password with bcrypt
      const passwordHash = await hashPassword(password);

      // Check if this is the first user - make them admin
      const userCount = await prisma.user.count();
      const userRole = userCount === 0 ? "admin" : "member";

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: userRole,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = generateToken(user);

      // Set cookie and send response
      res.cookie("token", token, getCookieOptions());
      res.status(201).json({
        message:
          userCount === 0
            ? "Admin account created successfully"
            : "User created successfully",
        user,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Verify password with bcrypt
      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Generate token
      const token = generateToken(user);

      // Set cookie
      res.cookie("token", token, getCookieOptions());

      // Return user without password hash
      const { passwordHash, ...userWithoutHash } = user;
      res.json({
        message: "Login successful",
        user: userWithoutHash,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async logout(req: Request, res: Response) {
    res.clearCookie("token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json({ message: "Logged out successfully" });
  },

  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              createdProjects: true,
              projectMembers: true,
              assignedTasks: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error("Me error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
