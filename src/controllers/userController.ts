import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "../di-types";
import { CreateUserInput } from "../types";

@injectable()
export class UserController {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async createFirstAdmin(req: Request, res: Response) {
        try {
            const { email, organizationId } = req.body;

            if (!email || !organizationId) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required (email, organizationId)"
                });
            }

            
            const org = await this.prisma.organization.findUnique({
                where: { id: organizationId }
            });

            if (!org) {
                return res.status(404).json({
                    success: false,
                    message: "Organization not found. Create an organization first."
                });
            }

           
            const existingAdmin = await this.prisma.user.findFirst({
                where: { organizationId, role: 'ADMIN' }
            });

            if (existingAdmin) {
                return res.status(200).json({
                    success: true,
                    message: "Admin already exists for this organization. Use this ID in x-user-id header.",
                    data: existingAdmin
                });
            }

            const existingUser = await this.prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "User with this email already exists"
                });
            }

            const admin = await this.prisma.user.create({
                data: {
                    email,
                    organizationId,
                    role: 'ADMIN'
                }
            });

            return res.status(201).json({
                success: true,
                message: "Admin user created successfully. Use this ID in x-user-id header for admin routes.",
                data: admin
            });

        } catch (error) {
            console.error("Error in creating admin:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async createUser(req: Request, res: Response) {
        try {
            const input: CreateUserInput = req.body;
            
            if (!input.email || !input.organizationId || !input.role) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required (email, organizationId, role)"
                });
            }

            const existingUser = await this.prisma.user.findUnique({
                where: { email: input.email }
            });
            
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "User with this email already exists"
                });
            }

            const user = await this.prisma.user.create({
                data: input
            });

            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: user
            });

        } catch (error) {
            console.error("Error in creating user:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}