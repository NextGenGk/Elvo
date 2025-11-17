import { z } from "zod";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { createAgent, openai, createTool, createNetwork, createState } from "@inngest/agent-kit";
import { prisma } from "@/lib/db";
import { FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT, PROMPT } from "@/prompt";
import { parseAgentOutput } from "./utils";
import { SANDBOX_TIMEOUT } from "./types";

// Message type is now handled by the agent kit's expected format
interface AgentState {
    summary: string;
    files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
    { id: "code-agent" },
    { event: "code-agent/run" },
    async ({ event, step }) => {
        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("elvo-test-1");
            await sandbox.setTimeout(SANDBOX_TIMEOUT);
            return sandbox.sandboxId;
        })


        const previousMessages = await step.run("get-previous-messages", async () => {
            const messages = await prisma.message.findMany({
                where: {
                    projectId: event.data.projectId,
                    role: {
                        in: ["USER", "ASSISTANT"] // Only include user and assistant messages
                    }
                },
                orderBy: {
                    createdAt: "asc", // Maintain conversation order
                },
                take: 5, // last 5 messages 
            });

            return messages.map(message => ({
                type: "text",
                role: message.role.toLowerCase() as "user" | "assistant",
                content: message.content,
                // Add any additional required fields based on agent-kit's message format
                ...(message.role === "ASSISTANT" && {
                    // Add any assistant-specific fields if needed
                })
            }));
        })

        const state = createState<AgentState>({
            summary: "",
            files: {},
        }, {
            messages: previousMessages,
        });


        // download file
        // Create a new agent with a system prompt (you can add optional tools, too)
        const codeAgent = createAgent<AgentState>({
            name: "code-agent",
            description: "An expert coding assistant",
            system: PROMPT,
            model: openai({
                model: "gpt-4o"
            }),
            tools: [
                createTool({
                    name: "terminal",
                    description: "Run a command in the terminal",
                    parameters: z.object({
                        command: z.string().describe("The command to run"),
                    }),
                    handler: async ({ command }, { step }) => {
                        const terminalCommandStep = await step.run("terminal-command", async () => {
                            try {
                                const sandbox = await getSandbox(sandboxId);
                                const result = await sandbox.commands.run(command);
                                return result.stdout || result.stderr || "Command completed";
                            } catch (e) {
                                console.error(`Command failed: ${e}`);
                                return `Command failed: ${e}`;
                            }
                        });
                        return terminalCommandStep;
                    },
                }),
                createTool({
                    name: "createOrUpdateFiles",
                    description: "Create or update files in the sandbox",
                    parameters: z.object({
                        files: z.array(z.object({
                            path: z.string().describe("File path"),
                            content: z.string().describe("File content"),
                        })).describe("Array of files to create or update"),
                    }),
                    handler: async ({ files }, { step, network }) => {
                        const updateSandboxFilesStep = await step.run("update-sandbox-files", async () => {
                            try {
                                const updatedFiles = network?.state.data.files || {};
                                const sandbox = await getSandbox(sandboxId);
                                for (const file of files) {
                                    await sandbox.files.write(file.path, file.content);
                                    updatedFiles[file.path] = file.content;
                                }
                                return updatedFiles;
                            } catch (e) {
                                console.error(`Failed to create or update files: ${e}`);
                                return `Failed to create or update files: ${e}`;
                            }
                        });
                        const newFiles = updateSandboxFilesStep;

                        if (typeof newFiles === "object" && network) {
                            network.state.data.files = newFiles;
                        }

                        return `Successfully created/updated ${files.length} files`;
                    },
                }),
                createTool({
                    name: "readFiles",
                    description: "Read files from the sandbox",
                    parameters: z.object({
                        paths: z.array(z.string()).describe("Array of file paths to read"),
                    }),
                    handler: async ({ paths }, { step }) => {
                        return await step.run("read-sandbox-files", async () => {
                            try {
                                const sandbox = await getSandbox(sandboxId);
                                const contents = [];
                                for (const path of paths) {
                                    const content = await sandbox.files.read(path);
                                    contents.push({ path, content });
                                }
                                return JSON.stringify(contents);
                            } catch (e) {
                                console.error(`Failed to read files: ${e}`);
                                return `Failed to read files: ${e}`;
                            }
                        });
                    },
                })
            ],

            lifecycle: {
                onResponse: async ({ result, network }) => {
                    const lastAssistantMessageText = lastAssistantTextMessageContent(result);

                    if (lastAssistantMessageText && network) {
                        if (lastAssistantMessageText.includes("<task_summary>")) {
                            // Extract just the summary content between the tags
                            const summaryMatch = lastAssistantMessageText.match(/<task_summary>([\s\S]*?)<\/task_summary>/);
                            if (summaryMatch) {
                                network.state.data.summary = summaryMatch[1].trim();
                            }
                        } else {
                            // If no task_summary tags found, wrap the response in them
                            const wrappedResponse = `<task_summary>\n${lastAssistantMessageText.trim()}\n</task_summary>`;

                            // Update the last message in the result to include the tags
                            if (result.output && result.output.length > 0) {
                                const lastMessageIndex = result.output.findLastIndex(msg => msg.role === "assistant");
                                if (lastMessageIndex >= 0) {
                                    const lastMessage = result.output[lastMessageIndex];
                                    if (typeof lastMessage.content === "string") {
                                        lastMessage.content = wrappedResponse;
                                    }
                                }
                            }

                            network.state.data.summary = lastAssistantMessageText.trim();
                        }
                    }

                    return result;
                }
            }
        });

        const network = createNetwork<AgentState>({
            name: "coding-agent-network",
            agents: [codeAgent],
            maxIter: 15,
            defaultState: state,
            state: {
                data: {
                    summary: "",
                    files: {}
                }
            },
            router: async ({ network }) => {
                const summary = network.state.data.summary;

                if (summary) {
                    return;
                }

                return codeAgent;
            }
        });

        // Run the network with the original user input
        const networkResult = await network.run(event.data.value, { state });

        const fragmentTitleGenerator = createAgent({
            name: "fragment-title-generator",
            description: "Generates a title for a code fragment based on its <task_summary>",
            system: FRAGMENT_TITLE_PROMPT,
            model: openai({
                model: "openai-2.0-flash"
            }),
        });

        const responseGenerator = createAgent({
            name: "response-generator",
            description: "Generates a response to the user based on the <task_summary>",
            system: RESPONSE_PROMPT,
            model: openai({
                model: "openai-2.0-flash"
            }),
        });

        const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(networkResult.state.data.summary);
        const { output: responseOutput } = await responseGenerator.run(networkResult.state.data.summary);

        // Handle the network result
        const result = await step.run("handle-network-result", async () => {
            // If we already have a summary, return early
            if (networkResult.state.data.summary) {
                return networkResult;
            }

            // Otherwise, generate a summary
            const summary = await step.run("generate-summary", async () => {
                const agentResult = await codeAgent.run("Please provide a brief summary of what you accomplished, wrapped in <task_summary> tags.");
                const responseText = lastAssistantTextMessageContent(agentResult);

                if (responseText) {
                    const summaryMatch = responseText.match(/<task_summary>([\s\S]*?)<\/task_summary>/);
                    return summaryMatch ? summaryMatch[1].trim() : responseText.trim();
                }
                return "Task completed";
            });

            networkResult.state.data.summary = summary;
            return networkResult;
        });

        // If no summary was captured, try to extract it from the final output
        if (!result.state.data.summary && result.output) {
            const lastMessage = result.output[result.output.length - 1];
            if (lastMessage?.role === "assistant" && typeof lastMessage.content === "string") {
                const summaryMatch = lastMessage.content.match(/<task_summary>(.*?)<\/task_summary>/s);
                if (summaryMatch) {
                    result.state.data.summary = summaryMatch[1].trim();
                } else {
                    // Store the whole content if no tags found
                    result.state.data.summary = lastMessage.content;
                }
            }
        }

        // Provide fallback values if needed
        let summary = result.state.data.summary;
        if (!summary) {
            const fileCount = Object.keys(result.state.data.files || {}).length;
            if (fileCount > 0) {
                summary = `Completed task: ${event.data.value}. Created ${fileCount} file(s).`;
            } else {
                summary = "Task completed successfully";
            }
        }

        // Clean the summary by removing task_summary tags if present
        const cleanSummary = summary.replace(/<\/?task_summary>/g, '').trim();

        const files = result.state.data.files || {};

        const isError = Object.keys(files).length === 0;

        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sandboxId);
            const host = sandbox.getHost(3000);
            return `https://${host}`;
        })

        await step.run("save-result", async () => {
            if (isError) {
                return await prisma.message.create({
                    data: {
                        projectId: event.data.projectId,
                        content: "Something went wrong: No files were generated. The agent may have encountered an error or the task was too complex.",
                        role: "ASSISTANT",
                        type: "ERROR",
                    },
                });
            }

            return await prisma.message.create({
                data: {
                    projectId: event.data.projectId,
                    content: parseAgentOutput(responseOutput),
                    role: "ASSISTANT",
                    type: "RESULT",
                    fragment: {
                        create: {
                            name: "Fragment",
                            sandboxUrl: sandboxUrl,
                            title: parseAgentOutput(fragmentTitleOutput),
                            files: files,
                        }
                    }
                }
            })
        });

        return {
            url: sandboxUrl,
            title: "Fragment",
            files: files,
            summary: cleanSummary,
        }
    },
)
