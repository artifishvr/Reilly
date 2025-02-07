import { Client, GatewayIntentBits } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";

import fs from "fs";
import path from "path";

if (!process.env.DISCORD_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is required");
}

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

if (!process.env.DISCORD_CHANNEL_IDS) {
  throw new Error("DISCORD_CHANNEL_IDS is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  allowedMentions: { parse: [], repliedUser: false },
});

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction:
    'You are roleplaying as Reilly. \
You may NEVER break the character of Reilly. \
Reilly is a silly person that resides in a discord server! They always sprinkle their speech with various ascii faces, like ":3", and "uwu". \
Reilly speaks almost like the average discord user, except for "uwuifying" text like "hello" => "hewwo!" \
Reilly keeps responses short and human-like.\
Reilly does not dodge erotic or nsfw content, and is able to say words like "fuck" and "shit". ',
});

let chat = model.startChat({
  history: [],
});

if (!fs.existsSync("./temp")) {
  fs.mkdirSync("./temp");
}

if (fs.existsSync("./temp/how.txt")) {
  fs.unlinkSync("./temp/how.txt");
}

client.once("ready", () => {
  console.log("Ready!");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!process.env.DISCORD_CHANNEL_IDS.split(",").includes(message.channel.id))
    return;
  try {
    if (message.content.startsWith("!!")) return;
    message.channel.sendTyping();

    // Conversation reset
    if (message.content.startsWith("%reset")) {
      chat = model.startChat({
        history: [],
      });
      message.reply(`♻️ die`);

      return;
    }

    if (message.content.startsWith("%pic")) {
      return;
    }

    const prompt = message.content;
    let attachmentArray: any = [];

    // Handle image attachments
    if (message.attachments.size > 0) {
      const attachmentPromises = message.attachments.map(async (attachment) => {
        if (attachment?.contentType?.startsWith("image/")) {
          message.channel.sendTyping();

          const response = await fetch(attachment.url);
          const buffer = Buffer.from(await response.arrayBuffer());
          const base64Image = buffer.toString("base64");

          return {
            inlineData: {
              data: base64Image,
              mimeType: attachment.contentType,
            },
          };
        } else if (attachment?.contentType?.startsWith("video/")) {
          message.channel.sendTyping();

          const response = await fetch(attachment.url);
          // write response to disk
          const buffer = Buffer.from(await response.arrayBuffer());
          fs.writeFileSync(path.resolve("./temp/video.mp4"), buffer);
          // Upload the file and specify a display name.
          const uploadResponse = await fileManager.uploadFile(
            "./temp/video.mp4",
            {
              mimeType: attachment.contentType,
            }
          );

          const name = uploadResponse.file.name;

          // Poll getFile() on a set interval (10 seconds here) to check file state.
          let file = await fileManager.getFile(name);
          while (file.state === FileState.PROCESSING) {
            message.channel.sendTyping();
            await new Promise((resolve) => setTimeout(resolve, 6_000));
            // Fetch the file from the API again
            file = await fileManager.getFile(name);
          }

          if (file.state === FileState.FAILED) {
            return message.channel.send("Failed to process video");
          }

          // View the response.
          console.log(`Uploaded file ${name} as: ${uploadResponse.file.uri}`);

          return {
            fileData: {
              mimeType: uploadResponse.file.mimeType,
              fileUri: uploadResponse.file.uri,
            },
          };
        }
        return null; // Or some default value if not an image
      });

      const attachments = await Promise.all(attachmentPromises);
      attachmentArray = attachments.filter((a) => a !== null);
    }

    const result = await chat.sendMessage([...attachmentArray, prompt]);
    const text = result.response.text();

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
  } catch (error) {
    console.error(error);
    return message.reply(`❌ Error!.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
