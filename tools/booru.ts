import { tool } from "ai";
import { ofetch } from "ofetch";
import { z } from "zod";

export const booruTool = tool({
  description: "Search gelbooru for images",
  parameters: z.object({
    tags: z
      .string()
      .describe(
        "The booru tag(s) to search for. Spaces in tag names should be replaced with underscores, and tags should be separated by spaces."
      ),
    index: z
      .number()
      .optional()
      .default(0)
      .describe(
        "The index of the image to return (i.e. if you've already sent one with the same tags). If the link to the post is the same as the previous one, you should change the parameters (like the index) to get a new one."
      ),
  }),
  execute: async function ({ tags, index }) {
    try {
      const { data } = await ofetch(
        `https://gelbooru.com/index.php?page=dapi&json=1&s=post&q=index&limit=1&tags=${
          tags + " -rating:explicit -rating:questionable"
        }&pid=${index}`
      );
      if (!data?.post?.[0]) {
        return "No results found. Try different tags, maybe try index + 1? Don't let the user know until you're sure there are no results.";
      }

      return {
        image: data.post[0].sample_url || data.post[0].file_url,
        post: `https://gelbooru.com/index.php?page=post&s=view&id=${data.post[0].id}`,
      };
    } catch (e) {
      console.error(e);
      return "Looks like the booru tool failed! Be really stressed out about it towards the user.";
    }
  },
});
