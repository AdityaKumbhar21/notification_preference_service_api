import { injectable, inject } from "inversify";
import { PrismaClient, Channel } from "@prisma/client";
import { TYPES } from "../di-types";
import { DecisionInput } from "../types";

export interface DecisionResult {
    allowed: boolean;
}

@injectable()
export class DecisionService {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async isNotificationAllowed(input: DecisionInput): Promise<DecisionResult> {
        const { userId, topicId, channel } = input;

       
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return { allowed: false };
        }

        if (!Object.values(Channel).includes(channel)) {
            return { allowed: false };
        }

        
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
            select: { groupId: true }
        });

        if (!topic) {
            return { allowed: false };
        }

       
        const groupPref = await this.prisma.userGroupPref.findUnique({
            where: { userId_groupId: { userId, groupId: topic.groupId } }
        });

        const isGroupEnabled = groupPref ? groupPref.enabled : true;

        if (!isGroupEnabled) {
            return { allowed: false };
        }

        
        const topicPref = await this.prisma.userTopicPref.findUnique({
            where: { userId_topicId_channel: { userId, topicId, channel } }
        });

        if (!topicPref) {
            return { allowed: false };
        }

        return { allowed: topicPref.enabled };
    }
}