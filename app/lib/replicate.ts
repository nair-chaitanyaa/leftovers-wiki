import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function getRecipeImage(prompt: string): Promise<string | null> {
  try {
    const output = await replicate.run(
      "stability-ai/sdxl:latest",
      {
        input: {
          prompt: `A beautiful, appetizing photo of ${prompt}, food photography, high quality, vibrant colors, studio lighting`,
          width: 512,
          height: 512,
        },
      }
    );
    if (Array.isArray(output) && output.length > 0) {
      return output[0];
    }
    return null;
  } catch (error) {
    console.error("Replicate image generation error:", error);
    return null;
  }
} 