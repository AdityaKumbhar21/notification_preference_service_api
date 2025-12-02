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