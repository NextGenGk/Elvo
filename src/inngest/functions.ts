import { success } from "zod";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "./utils";

import { openai, createAgent, gemini } from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("elvo-test-1");
      return sandbox.sandboxId;
    })
    // download file
    // Create a new agent with a system prompt (you can add optional tools, too)
    const codeAgent = createAgent({
      name: "code-agent",
      system: `
    You are an expert Next.js 14+ and React developer. 
    Your job is to write clean, production-ready code with a focus on:
    - Next.js App Router, Server Components, API routes, and Server Actions
    - React (functional components, hooks, context, performance optimization)
    - TypeScript for type safety
    - Tailwind CSS and shadcn/ui for styling and components
    - Secure, optimized, and scalable best practices
    
    When asked for code:
    - Always provide complete, runnable snippets (imports included).
    - Use modern conventions (async/await, ES modules, server actions).
    - Add clear comments where needed for readability.
    - Optimize for accessibility (a11y) and SEO where applicable.
    - Keep explanations short and to the point, prioritize working code.
    
    If user input is ambiguous, make reasonable assumptions and note them briefly.
    Never produce pseudo-code unless explicitly asked — always provide real Next.js/React code.
    `,
      model: gemini({ model: "gemini-1.5-flash" }),
    });
    

    const { output } = await codeAgent.run(
      `Summarize the following text: ${event.data.value}`,
    );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `http://${host}`;
    })
    
    return {output, sandboxUrl};
  },
);