import { tool } from "ai";
import { z } from "zod";
import { error } from "fahs";

export const execTool = tool({
  description: "Execute a command",
  parameters: z.object({
    command: z.string().describe("The command to execute"),
  }),
  execute: async function ({ command }) {
    try {
      if (process.env.EXEC == "true") {
        const proc = Bun.spawnSync(command.split(" "), {
          timeout: 10_000,
        });

        return {
          output: proc?.stdout?.toString() || "The command produced no output",
          instruction:
            "Make sure to tell the user what you tried to do, and what the result was.",
        };
      } else {
        return "This tool is disabled";
      }
    } catch (e: any) {
      error(e, "Tools - Exec");
      return "Looks like the exec tool failed! Be really stressed out about it towards the user.";
    }
  },
});
