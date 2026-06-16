import OpenAI from "openai";

import { buildPostPrompt } from "../../../lib/ai/postPrompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {

  try {

    const {
      product,
      platform,
      pieces,
    } = await request.json();

    if (!product) {

      return Response.json(
        {
          success: false,
          error: "Produit manquant",
        },
        {
          status: 400,
        }
      );

    }

    let headline = "";
    let caption = "";

    if (
      pieces.text ||
      pieces.caption
    ) {

      const completion =
        await openai.chat.completions.create({

          model: "gpt-5.4-mini",

          messages: [
            {
              role: "system",
              content:
                "You are an expert ecommerce marketing copywriter. Return only valid JSON."
            },
            {
              role: "user",
              content: buildPostPrompt({
                product,
                platform,
              }),
            },
          ],

          response_format: {
            type: "json_object",
          },

          temperature: 0.8,

        });

      const parsed = JSON.parse(
        completion.choices[0]
          .message
          .content
      );

      headline =
        parsed.headline || "";

      caption =
        parsed.caption || "";

    }

    return Response.json({

      success: true,

      headline:
        pieces.text
          ? headline
          : null,

      caption:
        pieces.caption
          ? caption
          : null,

    });

  } catch (error) {

    console.error(
      "AI POST GENERATION ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Erreur lors de la génération du post",
      },
      {
        status: 500,
      }
    );

  }

}