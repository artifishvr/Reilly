export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    channelIds: process.env.DISCORD_CHANNEL_IDS?.split(",") || [],
    dmEnabled: process.env.ENABLE_DMS === "true" || false,
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
  storage: {
    kvUrl: process.env.KV_URL,
  },
  models: {
    channelmodel: "models/gemini-2.5-flash-lite",
    dmmodel: "models/gemini-2.5-flash-lite",
  }
};

if (!config.discord.token) {
  throw new Error("DISCORD_TOKEN is required");
}

if (!config.ai.geminiApiKey) {
  throw new Error("GEMINI_API_KEY is required");
}

if (!config.discord.channelIds.length) {
  throw new Error("DISCORD_CHANNEL_IDS is required");
}
