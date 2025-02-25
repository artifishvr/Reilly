import { Message } from "discord.js";
import { handleChannelMessage } from "./channel-handler";
import { handleDmMessage } from "./dm-handler";
import { config } from "../config";

export async function handleMessage(message: Message) {
  if (!message.client?.user) return;
  if (message.author.bot) return;

  // Routing
  if (message.channel.isDMBased()) {
    if (config.discord.dmEnabled) {
      await handleDmMessage(message);
    }
  } else {
    await handleChannelMessage(message);
  }
}
