export function safelySendTyping(channel: any): void {
  try {
    if (channel?.sendTyping && typeof channel.sendTyping === "function") {
      channel.sendTyping().catch(() => {});
    }
  } catch (error) {
    // Silently ignore typing errors
  }
}
