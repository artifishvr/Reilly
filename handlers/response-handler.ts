import fs from "fs";
import path from "path";
import { Message, AttachmentBuilder } from "discord.js";
import type { GeneratedFile } from "ai";
import { error } from "fahs";

export async function sendResponse(
  message: Message,
  text?: string,
  files?: GeneratedFile[]
) {
  let discordAttachments: AttachmentBuilder[] = [];

  if (!text) text = "*(no text content)*";
  // Handle long responses
  if (text.length >= 2000) {
    fs.writeFileSync(path.resolve("./temp/how.txt"), text);
    await message.reply({
      content: "",
      files: ["./temp/how.txt"],
      failIfNotExists: false,
    });
    return;
  }

  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const buffer = Buffer.from(file.uint8Array);
        const attachment = new AttachmentBuilder(buffer);
        discordAttachments.push(attachment);
      } catch (e: any) {
        error(e, "Failed to process attachment");
      }
    }
  }

  // Send AI response
  try {
    await message.reply({
      content: `${text}`,
      files: discordAttachments.length > 0 ? discordAttachments : undefined,
      failIfNotExists: false,
    });
  } catch (e: any) {
    error(e, "Response Handler");
  }
}
