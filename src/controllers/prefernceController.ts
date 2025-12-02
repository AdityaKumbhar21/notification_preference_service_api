import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { PrismaClient, Channel } from "@prisma/client";
import { TYPES } from "../di-types";
import { DecisionService } from "../services/decision";
import { DecisionInput, UpdateGroupPrefInput, UpdateTopicPrefInput } from "../types";

@injectable()
export class PreferenceController {
    private prisma: PrismaClient;
    private decisionService: DecisionService;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient,
        @inject(TYPES.DecisionService) decisionService: DecisionService
    ) {
        this.prisma = prisma;
        this.decisionService = decisionService;
    }

    async setNotification(req: Request, res: Response) {
        try {
            const input: DecisionInput = req.body;

            if (!input.userId || !input.topicId || !input.channel) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required (userId, topicId, channel)"
                });
            }

            const result = await this.decisionService.isNotificationAllowed(input);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            return res.status(404).json({
                success: false,
                message
            });
        }
    }

    async updateGroupPref(req: Request, res: Response) {
        try {
            const input: UpdateGroupPrefInput = req.body;

            if (!input.userId || !input.groupId || input.enabled === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required (userId, groupId, enabled)"
                });
            }

            const updatedGroupPref = await this.prisma.userGroupPref.upsert({
                where: { userId_groupId: { userId: input.userId, groupId: input.groupId } },
                update: { enabled: input.enabled },
                create: { userId: input.userId, groupId: input.groupId, enabled: input.enabled }
            });

            return res.status(200).json({
                success: true,
                message: "Group preferences updated successfully",
                data: updatedGroupPref
            });
        } catch (error) {
            console.error("Error in updating group preference:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async updateTopicPref(req: Request, res: Response) {
        try {
            const input: UpdateTopicPrefInput = req.body;

            if (!input.userId || !input.topicId || input.enabled === undefined || !input.channel) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required (userId, topicId, channel, enabled)"
                });
            }

            const updatedTopicPref = await this.prisma.userTopicPref.upsert({
                where: { userId_topicId_channel: { userId: input.userId, topicId: input.topicId, channel: input.channel } },
                update: { enabled: input.enabled },
                create: { userId: input.userId, topicId: input.topicId, enabled: input.enabled, channel: input.channel }
            });

            return res.status(200).json({
                success: true,
                message: "Topic preferences updated successfully",
                data: updatedTopicPref
            });
        } catch (error) {
            console.error("Error in updating topic preference:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getUserPref(req: Request, res: Response) {
        try {
            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            const groups = await this.prisma.group.findMany({
                include: {
                    userPreferences: { where: { userId } },
                    topics: {
                        include: { userPreferences: { where: { userId } } },
                    },
                },
            });

            const channels = Object.values(Channel);

            const structured = groups.map(g => ({
                group: g.name,
                enabled: g.userPreferences[0]?.enabled ?? true,
                topics: g.topics.map(t => ({
                    topic: t.name,
                    channels: Object.fromEntries(
                        channels.map(ch => [ch, t.userPreferences.find(p => p.channel === ch)?.enabled ?? false])
                    ),
                })),
            }));

            return res.status(200).json({
                success: true,
                data: structured
            });
        } catch (error) {
            console.error("Error in getting user preferences:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}