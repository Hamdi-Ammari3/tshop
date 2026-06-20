import OpenAI from "openai";

import { buildPostPrompt } from "../../../lib/ai/postPrompt";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export async function POST(request) {

  try {

    const {product,language} = await request.json();

    const completion = await openai.chat.completions.create({

      model: "gpt-5-mini",

      messages: [
        {
          role: "system",
          content: "Return only valid JSON."
        },
        {
          role: "user",
          content: buildPostPrompt({
            product,
            language
          }),
        },
      ],

      response_format: {type: "json_object"},

    });

    const result = JSON.parse(completion.choices[0].message.content);

    return Response.json({
      success: true,
      caption: result.caption,
    });

  } catch(error) {

    console.log(error);

    return Response.json(
      {
        success: false,
        error: "Erreur lors de la génération",
      },
      {
        status: 500,
      }
    );

  }

}
