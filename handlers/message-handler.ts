import { Message } from "discord.js";
import { handleChannelMessage } from "./channel-handler";
import { handleDmMessage } from "./dm-handler";

export async function handleMessage(message: Message) {
  if (!message.client?.user) return;
  if (message.author.bot) return;

  // Route message to appropriate handler
  if (message.channel.isDMBased()) {
    await handleDmMessage(message);
  } else {
    await handleChannelMessage(message);
  }
}
