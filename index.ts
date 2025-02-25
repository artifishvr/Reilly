import fs from "fs";
import "./config";
import { setupDiscordClient } from "./client/discord-client";

// Set up temp directory if needed
if (!fs.existsSync("./temp")) {
  fs.mkdirSync("./temp");
}

// Start the application
setupDiscordClient();
