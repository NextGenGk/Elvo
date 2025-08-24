import { generateSlug } from 'random-word-slugs';
import { inngest } from '@/inngest/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, createTRPCRouter } from '@/trpc/init';
import { consumeCredits } from '@/lib/usage';

export const projectsRouter = createTRPCRouter({

    getOne: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, { message: 'ID is required' }),
            })
        )
        .query(async ({ input, ctx }) => {
            // Logic to get many messages
            const existingProject = await prisma.project.findUnique({
                where: {
                    id: input.id,
                    userId: ctx.auth.userId,
                },
            });

            if (!existingProject) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Project not found',
                });
            }

            return existingProject;
        }),

    getMany: protectedProcedure
        .query(async ({ ctx }) => {
            // Logic to get many messages
            const projects = await prisma.project.findMany({
                where: {
                    userId: ctx.auth.userId,
                },
                orderBy: {
                    updatedAt: 'desc',
                },
            });

            return projects;
        }),

    create: protectedProcedure
        .input(
            z.object({
                value: z.string().min(1, { message: 'Value is required' })
                    .max(10000, { message: 'Value is too long' }),
            })
        )
        .mutation(async ({ input, ctx }) => {

            try {
                await consumeCredits();
            } catch (error) {
                if (error instanceof Error) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Something went wrong" });
                } else {
                    throw new TRPCError({
                        code: "TOO_MANY_REQUESTS",
                        message: "You have run out of credits"
                    });
                }
            }

            const createdProject = await prisma.project.create({
                data: {
                    userId: ctx.auth.userId,
                    name: generateSlug(2, {
                        format: 'kebab',
                    }),
                    messages: {
                        create: {
                            content: input.value,
                            role: "USER",
                            type: "RESULT",
                        },
                    },
                }
            });

            await inngest.send({
                name: "code-agent/run",
                data: {
                    value: input.value,
                    projectId: createdProject.id,
                },
            });

            return createdProject;
        }),

    updateFragmentFiles: protectedProcedure
        .input(
            z.object({
                fragmentId: z.string().min(1, { message: 'Fragment ID is required' }),
                files: z.record(z.string(), z.string()),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // First, verify the fragment belongs to the user
            const fragment = await prisma.fragment.findFirst({
                where: {
                    id: input.fragmentId,
                    message: {
                        project: {
                            userId: ctx.auth.userId,
                        },
                    },
                },
            });

            if (!fragment) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Fragment not found',
                });
            }

            // Update the fragment files
            const updatedFragment = await prisma.fragment.update({
                where: {
                    id: input.fragmentId,
                },
                data: {
                    files: input.files,
                    updatedAt: new Date(),
                },
            });

            return updatedFragment;
        }),
});