import { createStorage } from "unstorage";
import redisDriver from "unstorage/drivers/redis";
import memoryDriver from "unstorage/drivers/memory";
import { config } from "../config";
import type { CoreMessage } from "ai";
import { info } from "fahs";

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

info(config.storage.kvUrl ? "Using external KV" : "Using in-memory KV", {
  label: "KV",
  timestamp: false,
});

export function createStorageKey(
  id: string,
  type: "dm" | "channel" = "channel"
): string {
  return type === "dm" ? `dm:${id}` : `chat:${id}`;
}

export async function getChatHistory(
  id: string,
  initial: CoreMessage[],
  type: "dm" | "channel" = "channel"
) {
  const key = createStorageKey(id, type);
  return (await storage.getItem<CoreMessage[]>(key)) || initial;
}

export async function saveChatHistory(
  id: string,
  chat: CoreMessage[],
  ephemeral = false,
  type: "dm" | "channel" = "channel"
) {
  const key = createStorageKey(id, type);

  if (ephemeral) {
    await storage.setItem(key, chat, {
      ttl: 60 * 60 * 1000, // 1 hour
    });
  } else {
    await storage.setItem(key, chat);
  }
}

export async function resetChatHistory(
  id: string,
  type: "dm" | "channel" = "channel"
) {
  const key = createStorageKey(id, type);
  await storage.removeItem(key);
}
