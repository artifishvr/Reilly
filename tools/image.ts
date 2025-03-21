import { tool } from "ai";
import { z } from "zod";
import { error } from "fahs";
import { createFal } from "@ai-sdk/fal";
import { experimental_generateImage as generateImage } from "ai";

const fal = createFal();

export const imageTool = tool({
  description: "Generate an image (use sparingly)",
  parameters: z.object({
    prompt: z
      .string()
      .describe(
        "A descriptive prompt with keywords describing the image you want to generate."
      ),
    type: z
      .enum(["text", "general"])
      .describe(
        "The type of image to generate: 'text' for images with text, 'general' for standard images"
      )
      .default("general"),
  }),
  execute: async function ({ prompt, type }) {
    try {
      const model =
        type === "text"
          ? fal.image("fal-ai/fast-sdxl")
          : fal.image("fal-ai/flux/schnell");

      const { image } = await generateImage({
        model,
        prompt: prompt,
        providerOptions: {
          fal: {
            enable_safety_checker: false,
          },
        },
      });

      const formData = new FormData();
      formData.append("image", image.base64);

      const imgbb = await fetch(
        `https://api.imgbb.com/1/upload?key=${process.env.IMAGEBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      ).then((res) => res.json());

      return imgbb.data.url;
    } catch (e: any) {
      error(e, "Tools - Image Gen");
      return "Looks like the image generation tool failed! Be really stressed out about it towards the user.";
    }
  },
});
