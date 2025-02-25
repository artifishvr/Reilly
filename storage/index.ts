import { createStorage } from "unstorage";
import redisDriver from "unstorage/drivers/redis";
import memoryDriver from "unstorage/drivers/memory";
import { config } from "../config";
import type { CoreMessage } from "ai";

export const storage = config.storage.kvUrl
  ? createStorage({
      driver: redisDriver({
        base: "reilly",
        url: config.storage.kvUrl,
      }),
    })
  : createStorage({
      driver: memoryDriver(),
    });

console.log(config.storage.kvUrl ? "Using external KV" : "Using in-memory KV");

export async function getChatHistory(
  channelId: string,
  initial: CoreMessage[]
) {
  return (await storage.getItem<CoreMessage[]>(`chat:${channelId}`)) || initial;
}

export async function saveChatHistory(
  channelId: string,
  chat: CoreMessage[],
  ephemeral = false
) {
  if (ephemeral) {
    await storage.setItem(`chat:${channelId}`, chat, {
      ttl: 60 * 60 * 1000, // 1 hour
    });
  } else {
    await storage.setItem(`chat:${channelId}`, chat);
  }
}

export async function resetChatHistory(channelId: string) {
  await storage.removeItem(`chat:${channelId}`);
}
