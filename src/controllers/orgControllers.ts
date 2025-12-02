import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "../di-types";
import { CreateOrgInput } from "../types";

@injectable()
export class OrgController {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async createOrg(req: Request, res: Response) {
        try {
            const input: CreateOrgInput = req.body;

            if (!input.name) {
                return res.status(400).json({
                    success: false,
                    message: "Name is required"
                });
            }

            const existingOrg = await this.prisma.organization.findFirst({
                where: { name: input.name }
            });

            if (existingOrg) {
                return res.status(409).json({
                    success: false,
                    message: "Organization with this name already exists"
                });
            }

            const org = await this.prisma.organization.create({
                data: { name: input.name }
            });

            return res.status(201).json({
                success: true,
                message: "Organization created successfully",
                data: org
            });

        } catch (error) {
            console.error("Error in creating org:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getCustomers(req: Request, res: Response) {
        try {
            const orgId = req.params.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    message: "Organization ID required"
                });
            }

            const customers = await this.prisma.user.findMany({
                where: { organizationId: orgId, role: 'CUSTOMER' }
            });

            return res.status(200).json({
                success: true,
                message: "Customers fetched successfully",
                data: customers
            });

        } catch (error) {
            console.error("Error in getting customers:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}