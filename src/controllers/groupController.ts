import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "../di-types";
import { CreateGroupInput } from "../types";

@injectable()
export class GroupController {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async createGroup(req: Request, res: Response) {
        try {
            const input: CreateGroupInput = req.body;

            if (!input.name || !input.organizationId) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required (name, organizationId)"
                });
            }

            const existingGroup = await this.prisma.group.findFirst({
                where: {
                    name: input.name,
                    organizationId: input.organizationId,
                }
            });

            if (existingGroup) {
                return res.status(409).json({
                    success: false,
                    message: "Group with this name already exists in the organization"
                });
            }

            const group = await this.prisma.group.create({
                data: {
                    name: input.name,
                    organizationId: input.organizationId,
                }
            });

            return res.status(201).json({
                success: true,
                message: "Group created successfully",
                data: group
            });
        } catch (error) {
            console.error("Error in createGroup:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async fetchGroups(req: Request, res: Response) {
        try {
            const orgId = req.params.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    message: "Organization ID is required"
                });
            }

            const groups = await this.prisma.group.findMany({
                where: { organizationId: orgId },
                include: {
                    topics: true
                }
            });

            return res.status(200).json({
                success: true,
                message: "Groups fetched successfully",
                data: groups
            });
        } catch (error) {
            console.error("Error in fetchGroups:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}