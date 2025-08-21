import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import { inngest } from '@/inngest/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const messagesRouter = createTRPCRouter({

    getMany: baseProcedure
        .query(async () => {
            // Logic to get many messages
            const messages = await prisma.message.findMany({
                orderBy: {
                    updatedAt: 'desc',
                },
            });

            return messages;
        }),

    create: baseProcedure
        .input(
            z.object({
                 value: z.string().min(1, { message: 'Value is required' })
                                .max(10000, { message: 'Value is too long' }),
                                projectId: z.string().min(1, { message: 'Project ID is required' }),
            })
        )
        .mutation(async ({ input }) => {
            // Logic to create a message
            const createdMessage = await prisma.message.create({
                data: {
                    projectId: input.projectId,
                    content: input.value,
                    role: "USER",
                    type: "RESULT",
                },
            });


            await inngest.send({
                name: "code-agent/run",
                data: {
                    value: input.value,
                    projectId: input.projectId,
                },
            });

            return createdMessage;
        }),


});