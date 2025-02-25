import { Message } from "discord.js";
import type { CoreMessage } from "ai";
import { safelySendTyping } from "./typing-handler";

export async function processAttachments(
  message: Message,
  chat: CoreMessage[]
) {
  const contentArray: any[] = [];

  if (message.attachments.size > 0) {
    const attachmentPromises = message.attachments.map(async (attachment) => {
      if (attachment?.contentType?.startsWith("image/")) {
        safelySendTyping(message.channel);

        const response = await fetch(attachment.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const base64Image = buffer.toString("base64");

        return {
          type: "image",
          image: base64Image,
          size: attachment.size,
        };
      } else if (!attachment?.contentType?.startsWith("bidoof/")) {
        // todo actually have a list of supported attachments
        // Large file check
        if (attachment.size > 8000000) {
          chat.push({
            role: "user",
            content: `Info: The user sent a message with an attachment too large for you to download. Let them know.`,
          });
          return null;
        }

        safelySendTyping(message.channel);
        const response = await fetch(attachment.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const base64File = buffer.toString("base64");

        return {
          type: "file",
          mimeType: attachment.contentType,
          data: base64File,
          size: attachment.size,
        };
      }

      chat.push({
        role: "user",
        content: `Info: The user sent a message with an attachment you can't comprehend. Let them know.`,
      });
      return null;
    });

    const attachments = await Promise.all(attachmentPromises);
    return attachments.filter((a) => a !== null);
  }

  return contentArray;
}
