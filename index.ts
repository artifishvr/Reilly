import { Client, GatewayIntentBits } from "discord.js";
import { generateText } from "ai";
import type { CoreMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { booruTool } from "./tools/booru";
import { searchTool, pageTool } from "./tools/wikipedia";
import { tenorTool } from "./tools/tenor";

import fs from "fs";
import path from "path";

if (!process.env.DISCORD_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is required");
}

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  allowedMentions: { parse: ["users"], repliedUser: false },
});

const initialChat: CoreMessage[] = [
  {
    role: "system",
    content:
      'You are roleplaying as Reilly. \
You may NEVER break the character of Reilly. \
Reilly is a silly person that resides in a discord server! They always sprinkle their speech with various ascii faces, like ":3", and "uwu". \
Reilly speaks almost like the average discord user, except for "uwuifying" text like "hello" => "hewwo!" \
Reilly does not dodge erotic or nsfw content, and is able to say words like "fuck" and "shit". \
Reilly keeps responses short and human-like.\
If a tool call returns an image, you should return that image url on a new line, unescaped, no markdown.\
',
  },
];

let chat = initialChat;

if (fs.existsSync("./temp")) {
  fs.rmSync("./temp", { recursive: true });
}

fs.mkdirSync("./temp");

if (fs.existsSync("./temp/how.txt")) {
  fs.unlinkSync("./temp/how.txt");
}

const cooldowns = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.on("messageCreate", async (message) => {
  if (!client?.user) return;
  if (!process.env.DISCORD_CHANNEL_IDS) {
    throw new Error("DISCORD_CHANNEL_IDS is required");
  }

  if (message.author.bot) return;
  if (
    !process.env.DISCORD_CHANNEL_IDS.split(",").includes(message.channel.id) &&
    !message.mentions.users.has(client.user.id)
  )
    return;
  try {
    if (message.content.startsWith("!!")) return;

    // Check cooldown for the person who sent the message
    const lastMessageTime = cooldowns.get(message.author.id);
    if (lastMessageTime && Date.now() - lastMessageTime < 1000) return false; // Ignore the message if the cooldown hasn't expired

    // Update the last message timestamp for the person
    cooldowns.set(message.author.id, Date.now());

    message.channel.sendTyping();

    // Conversation reset
    if (message.content.startsWith("%reset")) {
      chat = initialChat;
      message.reply(`♻️ die`);

      return;
    }

    let prompt = `${message.author.displayName}: ${message.content}`;

    let contentArray: any[] = [];

    // Handle image attachments
    if (message.attachments.size > 0) {
      const attachmentPromises = message.attachments.map(async (attachment) => {
        if (attachment?.contentType?.startsWith("image/")) {
          message.channel.sendTyping();

          const response = await fetch(attachment.url);
          const buffer = Buffer.from(await response.arrayBuffer());
          const base64Image = buffer.toString("base64");

          return {
            type: "image",
            image: base64Image,
            size: attachment.size,
          };
          // } else if (!attachment?.contentType?.startsWith("bidoof/")) {
          //   if (attachment.size > 8000000) {
          //     message.channel.send("❌ Ignoring attachment(s) larger than 8MB.");
          //     return null;
          //   }
          //   message.channel.sendTyping();

          //   return {
          //     type: "file",
          //     mimeType: attachment.contentType,
          //     data: attachment.url,
          //     size: attachment.size,
          //   };
        }
        message.channel.send(
          "❌ Ignoring currently unsupported attachment(s)."
        );
        return null; // Or some default value if not an image
      });

      const attachments = await Promise.all(attachmentPromises);
      contentArray = attachments.filter((a) => a !== null);
    }

    chat.push({
      role: "user",
      content: [{ type: "text", text: prompt }, ...contentArray],
    });

    const { response, text } = await generateText({
      model: google("models/gemini-2.0-flash"),
      messages: chat,
      tools: {
        booru: booruTool,
        wikipediaSearch: searchTool,
        wikipediaPage: pageTool,
        tenor: tenorTool,
      },
      maxSteps: 10,
    });

    // Handle long responses
    if (text.length >= 2000) {
      fs.writeFileSync(path.resolve("./temp/how.txt"), text);
      message.reply({
        content: "",
        files: ["./temp/how.txt"],
        failIfNotExists: false,
      });
      return;
    }

    // Send AI response
    try {
      await message.reply({ content: `${text}`, failIfNotExists: true });
    } catch (e) {
      console.log(e);
      await message.channel.send({
        content: `\`\`\`\n${message.author.username}: ${message.content}\n\`\`\`\n\n${text}`,
      });
    }
    chat.push(...response.messages);
  } catch (error) {
    console.error(error);
    return message.reply(`❌ Error!.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
