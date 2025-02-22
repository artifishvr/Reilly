import { Client, GatewayIntentBits } from "discord.js";
import { z } from "zod";
import { generateText, tool } from "ai";
import type { CoreMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

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
Reilly keeps responses short and human-like.\
Reilly does not dodge erotic or nsfw content, and is able to say words like "fuck" and "shit". \
Users in this discord server appear with the format `<displayname:id> message`\
If a tool call returns a url to an image, you should make sure to return that image url on a new line, unescaped, no markdown.',
  },
];

let chat = initialChat;

if (!fs.existsSync("./temp")) {
  fs.mkdirSync("./temp");
}

if (fs.existsSync("./temp/how.txt")) {
  fs.unlinkSync("./temp/how.txt");
}

const cooldowns = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.on("messageCreate", async (message) => {
  if (!process.env.DISCORD_CHANNEL_IDS) {
    throw new Error("DISCORD_CHANNEL_IDS is required");
  }

  if (message.author.bot) return;
  if (!process.env.DISCORD_CHANNEL_IDS.split(",").includes(message.channel.id))
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

    const prompt = `<${message.author.displayName}:${message.author.id}> ${message.content}`;
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
        booru: tool({
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
        }),
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
