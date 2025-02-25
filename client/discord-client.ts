import {
  Client,
  GatewayIntentBits,
  PresenceUpdateStatus,
  ActivityType,
} from "discord.js";
import { config } from "../config";
import { handleMessage } from "../handlers/message-handler";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  allowedMentions: { parse: ["users"], repliedUser: false },
});

export function setupDiscordClient() {
  client.once("ready", () => {
    console.log("Ready!");
    if (!client.user) return;
    client.user.setPresence({
      activities: [{ name: "watching ur dms!", type: ActivityType.Custom }],
      status: PresenceUpdateStatus.Idle,
    });
  });

  client.on("messageCreate", handleMessage);

  client.login(config.discord.token);
}
