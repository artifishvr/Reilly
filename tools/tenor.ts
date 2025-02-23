import { tool } from "ai";
import { z } from "zod";
import { ofetch } from "ofetch";

export const tenorTool = tool({
  description: "Search tenor for gifs",
  parameters: z.object({
    query: z.string().describe("Tenor search query"),
  }),
  execute: async function ({ query }) {
    try {
      let cleanPageList: { url: string; description: string }[] = [];

      const { results } = await ofetch(
        `https://tenor.googleapis.com/v2/search?key=${process.env.TENOR_API_KEY}&q=${query}&limit=10`
      );

      results.forEach((result: any) => {
        cleanPageList.push({
          url: result.itemurl,
          description: result.content_description,
        });
      });

      return cleanPageList;
    } catch (e) {
      console.error(e);
      return "Looks like the tenor tool failed! Be really stressed out about it towards the user.";
    }
  },
});
