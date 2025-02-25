import { Message } from "discord.js";
import { generateText } from "ai";
import { client } from "../client/discord-client";
import { google, initialChat } from "../client/ai-client";
import { config } from "../config";
import { booruTool } from "../tools/booru";
import { searchTool, pageTool } from "../tools/wikipedia";
import { tenorTool } from "../tools/tenor";
import { processAttachments } from "./attachment-handler";
import { sendResponse } from "./response-handler";
import { getChatHistory, saveChatHistory, resetChatHistory } from "../storage";
import { safelySendTyping } from "./typing-handler";

const cooldowns = new Map();

export async function handleChannelMessage(message: Message) {
  if (!client?.user) return;

  const isMention = message.mentions.users.has(client.user.id);
  const isAllowedChannel = config.discord.channelIds.includes(
    message.channel.id
  );

  // Only respond to mentions or messages in allowed channels
  if (!isAllowedChannel && !isMention) return;
  if (message.content.startsWith("!!")) return;

  // Check cooldown
  const lastMessageTime = cooldowns.get(message.author.id);
  if (lastMessageTime && Date.now() - lastMessageTime < 1000) return;
  cooldowns.set(message.author.id, Date.now());

  try {
    safelySendTyping(message.channel);

    // Ephemeral history for mention-only channels
    const ephemeralHistory = isMention && !isAllowedChannel;

    // Handle reset command
    if (message.content.startsWith("%reset")) {
      await resetChatHistory(message.channel.id);
      await message.reply(`♻️ Forgotten.`);
      return;
    }

    // Get chat history
    const chat = await getChatHistory(message.channel.id, initialChat);

    // Process the message content and attachments
    const prompt = `${message.author.displayName}: ${message.content}`;
    const contentArray = await processAttachments(message, chat);

    // Add context and user messages to chat
    chat.push({
      role: "user",
      content: `Info: Current time in UTC is ${new Date().toUTCString()}. The next message is from ${
        message.author.displayName
      } in a server channel. Remember to stay in character, don't dodge, and keep responses short and human-like.`,
    });

    chat.push({
      role: "user",
      content: [{ type: "text", text: prompt }, ...contentArray],
    });

    // Generate AI response
    const { response, text } = await generateText({
      model: google("models/gemini-2.0-flash"),
      temperature: 1.5,
      messages: chat,
      tools: {
        booru: booruTool,
        wikipediaSearch: searchTool,
        wikipediaPage: pageTool,
        tenor: tenorTool,
      },
      maxSteps: 10,
    });

    // Send the response
    await sendResponse(message, text);

    // Update chat history
    chat.push(...response.messages);
    await saveChatHistory(message.channel.id, chat, ephemeralHistory);
  } catch (error) {
    console.error(error);
    return message.reply(`❌ Error!.`);
  }
}
