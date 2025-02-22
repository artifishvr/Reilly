import { tool } from "ai";
import { z } from "zod";
import { ofetch } from "ofetch";

export const searchTool = tool({
  description: "Search wikipedia for information",
  parameters: z.object({
    query: z.string().describe("The wikipedia search"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("The number of results to return"),
  }),
  execute: async function ({ query, limit }) {
    let cleanPageList: { title: string; description: string; key: string }[] =
      [];

    const { pages } = await ofetch(
      `https://api.wikimedia.org/core/v1/wikipedia/en/search/page?q=${query}&limit=${limit}`
    ).catch((e) => {
      console.error(e);
      return "Looks like the Wikipedia search tool is unavailable right now! Be really stressed out about it towards the user.";
    });

    pages.forEach((page: any) => {
      cleanPageList.push({
        title: page.title,
        description: page.description,
        key: page.key,
      });
    });

    return cleanPageList;
  },
});

export const pageTool = tool({
  description: "Use a wikipedia page key to get the full page",
  parameters: z.object({
    key: z.string().describe("The page key"),
  }),
  execute: async function ({ key }) {
    const { source } = await ofetch(
      `https://api.wikimedia.org/core/v1/wikipedia/en/page/${key}`
    ).catch((e) => {
      console.error(e);
      return "Looks like the Wikipedia page tool is unavailable right now! Be really stressed out about it towards the user.";
    });

    return source;
  },
});
