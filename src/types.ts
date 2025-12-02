import { Channel, Role } from '@prisma/client';

export type CreateOrgInput = { name: string };
export type CreateUserInput = { email: string; organizationId: string; role: Role };
export type CreateGroupInput = { name: string; organizationId: string };
export type CreateTopicInput = { name: string; groupId: string };
export type UpdateGroupPrefInput = { userId: string; groupId: string; enabled: boolean };
export type UpdateTopicPrefInput = { userId: string; topicId: string; channel: Channel; enabled: boolean };
export type DecisionInput = { userId: string; topicId: string; channel: Channel };