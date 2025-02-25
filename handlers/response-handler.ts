import fs from "fs";
import path from "path";
import { Message } from "discord.js";

export async function sendResponse(message: Message, text: string) {
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
  } catch (e) {
    console.log("Response Handler: " + e);
  }
}
