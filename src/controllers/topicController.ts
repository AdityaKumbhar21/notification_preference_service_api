import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "../di-types";
import { CreateTopicInput } from "../types";

@injectable()
export class TopicController {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async createTopic(req: Request, res: Response) {
        try {
            const input: CreateTopicInput = req.body;

            if (!input.name || !input.groupId) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required (name, groupId)"
                });
            }

            const existingTopic = await this.prisma.topic.findFirst({
                where: {
                    name: input.name,
                    groupId: input.groupId,
                }
            });

            if (existingTopic) {
                return res.status(409).json({
                    success: false,
                    message: "Topic with this name already exists in the group"
                });
            }

            const topic = await this.prisma.topic.create({
                data: {
                    name: input.name,
                    groupId: input.groupId
                }
            });

            return res.status(201).json({
                success: true,
                message: "Topic created successfully",
                data: topic
            });
        } catch (error) {
            console.error("Error in creating topic:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}