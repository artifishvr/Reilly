import { tool } from "ai";
import { ofetch } from "ofetch";
import { z } from "zod";
import { error } from "fahs";

export const searchTool = tool({
  description: "Search the web using Brave Search API",
  parameters: z.object({
    query: z.string().describe("The query to search for."),
  }),
  execute: async function ({ query }) {
    try {
      const searchResults = await ofetch(
        "https://api.search.brave.com/res/v1/web/search",
        {
          method: "GET",
          query: {
            q: query,
            result_filter: "web",
          },
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": process.env.BRAVE_API_KEY || "",
          },
        },
      );

      if (
        !searchResults?.web?.results ||
        searchResults.web.results.length === 0
      ) {
        return "No results found. Try something else? Don't let the user know until you're sure there are no results.";
      }

      return {
        results: searchResults.web.results,
        instruction:
          "Include these results in your response, in a format (e.g., summary, list, comparison) relevant to the request. For lists, format results as [Title](<URL>)",
      };
    } catch (e: any) {
      error(e, "Tools - Search");
      return "Looks like the search tool failed! Be really stressed out about it towards the user.";
    }
  },
});
