import { tool } from "ai";
import { z } from "zod";

export const booruTool = tool({
  description: "Search a booru for safe images",
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
    return fetch(
      `https://gelbooru.com/index.php?page=dapi&json=1&s=post&q=index&limit=1&tags=${
        tags + " -rating:explicit -rating:questionable"
      }&pid=${index}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data?.post?.[0]) {
          return "No results found. Try different tags, maybe try index + 1? Don't let the user know until you're sure there are no results.";
        }
        return {
          image: data.post[0].sample_url || data.post[0].file_url,
          post: `https://gelbooru.com/index.php?page=post&s=view&id=${data.post[0].id}`,
        };
      });
  },
});
