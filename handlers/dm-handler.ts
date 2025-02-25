import { Message } from "discord.js";
import { generateText } from "ai";
import { google, initialChat } from "../client/ai-client";
import { processAttachments } from "./attachment-handler";
import { sendResponse } from "./response-handler";
import { getChatHistory, saveChatHistory, resetChatHistory } from "../storage";
import { booruTool } from "../tools/booru";
import { searchTool, pageTool } from "../tools/wikipedia";
import { tenorTool } from "../tools/tenor";
import { safelySendTyping } from "./typing-handler";

const dmCooldowns = new Map();

export async function handleDmMessage(message: Message) {
  // Cooldowns
  const lastMessageTime = dmCooldowns.get(message.author.id);
  if (lastMessageTime && Date.now() - lastMessageTime < 2000) return;
  dmCooldowns.set(message.author.id, Date.now());

  try {
    safelySendTyping(message.channel);

    if (message.content.startsWith("%reset")) {
      await resetChatHistory(message.author.id, "dm");
      await message.reply(`♻️ Forgotten our DM conversation.`);
      return;
    }

    const chat = await getChatHistory(message.author.id, initialChat, "dm");

    const prompt = `${message.author.displayName}: ${message.content}`;
    const contentArray = await processAttachments(message, chat);

    // Context
    chat.push({
      role: "user",
      content: `Info: Current time in UTC is ${new Date().toUTCString()}. 
The next message is from ${
        message.author.displayName
      } in a private DM conversation. 
This is a one-on-one direct message conversation, not in a server channel.
Remember to stay in character, don't dodge, and keep responses short and human-like.`,
    });

    chat.push({
      role: "user",
      content: [{ type: "text", text: prompt }, ...contentArray],
    });

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

    await sendResponse(message, text);

    // Update chat history
    chat.push(...response.messages);
    await saveChatHistory(message.author.id, chat, false, "dm");
  } catch (error: any) {
    error(error, "DM Handler");
    return message.reply(`❌ Error in DM processing.`);
  }
}
