import fs from "fs";
import path from "path";
import { error } from "fahs";
import { Message } from "discord.js";

export async function sendResponse(message: Message, text: string) {
  // regex to fix markdown links
  text = text.replace(/\[(https?:\/\/[^\]]+)\]\([^)]+\)/g, "$1");

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

  // Send AI response
  try {
    await message.reply({ content: `${text}`, failIfNotExists: false });
  } catch (e: any) {
    error(e, "Response Handler");
  }
}
