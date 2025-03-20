import fs from "fs";
import path from "path";
import { error } from "fahs";

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
  } catch (e: any) {
    error(e, "Response Handler");
  }
}
