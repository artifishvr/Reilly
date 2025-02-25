import { tool } from "ai";
import { z } from "zod";
import { ofetch } from "ofetch";
import { error } from "fahs";

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
    try {
      let cleanPageList: {
        title: string;
        description: string;
        key: string;
      }[] = [];

      const { pages } = await ofetch(
        `https://api.wikimedia.org/core/v1/wikipedia/en/search/page?q=${query}&limit=${limit}`
      );

      pages.forEach((page: any) => {
        cleanPageList.push({
          title: page.title,
          description: page.description,
          key: page.key,
        });
      });

      return cleanPageList;
    } catch (e: any) {
      error(e, "Tools - Wikipedia Search");
      return "Looks like the wikipedia search tool failed! Be really stressed out about it towards the user.";
    }
  },
});

export const pageTool = tool({
  description: "Use a wikipedia page key to get the full page",
  parameters: z.object({
    key: z.string().describe("The page key"),
  }),
  execute: async function ({ key }) {
    try {
      const { source } = await ofetch(
        `https://api.wikimedia.org/core/v1/wikipedia/en/page/${key}`
      );
      const splitSource = source.split("\n\n==");

      if (splitSource.length > 0) {
        return splitSource[0];
      }

      return source;
    } catch (e: any) {
      error(e, "Tools - Wikipedia Page");
      return "Looks like the wikipedia page tool failed! Be really stressed out about it towards the user.";
    }
  },
});
