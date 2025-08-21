import { z } from "zod";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { createAgent, gemini, createTool, createNetwork, type Tool } from "@inngest/agent-kit";
import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

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
      return sandbox.sandboxId;
    })
    // download file
    // Create a new agent with a system prompt (you can add optional tools, too)
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding assistant",
      system: PROMPT,
      model: gemini({ 
        model: "gemini-2.0-flash" 
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Run a command in the terminal",
          parameters: z.object({
            command: z.string().describe("The command to run"),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command);
                return result.stdout || result.stderr || "Command completed";
              } catch (e) {
                console.error(`Command failed: ${e}`);
                return `Command failed: ${e}`;
              }
            });
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
          handler: async ({ files }, { step } : Tool.Options<AgentState>) => {
            return await step?.run("createOrUpdateFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                }
                return `Successfully created/updated ${files.length} files`;
              } catch (e) {
                console.error(`Failed to create or update files: ${e}`);
                return `Failed to create or update files: ${e}`;
              }
            });
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            paths: z.array(z.string()).describe("Array of file paths to read"),
          }),
          handler: async ({ paths }, { step }) => {
            return await step?.run("readFiles", async () => {
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
              network.state.data.summary = lastAssistantMessageText;
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

    const result = await network.run(event.data.value);

    const isError =
       !result.state.data.summary ||
       Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    })

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: "Something went wrong: No summary or files generated",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
      
      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              name: "Fragment",
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files || {},
            }
          }
        }
      })
    });

    return { 
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    }
  },
)