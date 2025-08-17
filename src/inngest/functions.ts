import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    // download file
    await step.sleep("wait-a-moment", "30s");

    // transcribe file
    await step.sleep("wait-a-moment", "10s");

    // generate summary
    await step.sleep("wait-a-moment", "5s");
    return { message: `Hello ${event.data.email}!` };
  },
);