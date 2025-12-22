import {
  Client,
  GatewayIntentBits,
  PresenceUpdateStatus,
  ActivityType,
  Partials,
} from "discord.js";
import { info } from "fahs";
import { config } from "../config";
import { handleMessage } from "../handlers/message-handler";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  allowedMentions: { parse: ["users"], repliedUser: false },
  partials: [Partials.Channel],
});

export function setupDiscordClient() {
  client.once("clientReady", () => {
    info(`Ready as ${client.user?.tag}!`, {
      label: "Discord Client",
      timestamp: false,
    });
    if (!client.user) return;
    client.user.setPresence({
      activities: [{ name: "watching ur dms!", type: ActivityType.Custom }],
      status: PresenceUpdateStatus.Idle,
    });
  });

  client.on("messageCreate", (message) => {
    handleMessage(message);
  });

  client.login(config.discord.token);
}
