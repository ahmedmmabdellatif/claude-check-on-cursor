// Cloudflare Worker – Fitness PDF Parser (RESTORED v4.1, Responses API per page)
// Endpoint: https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/
// Contract: accepts JSON from backend: { page_number, image_base64?, text? }
// Calls OpenAI Responses API (gpt-4.1-mini) and returns a JSON object with a top-level
//   "domains" array containing a "fitness_plan" domain (when applicable).

const PARSE_INSTRUCTIONS = `
You are an expert fitness document analyst.
You receive ONE PAGE at a time from a larger PDF (training, rehab, nutrition, etc.).
Your job is to return ONLY ONE JSON OBJECT with this exact structure:

{
  "domains": [
    {
      "type": "string (domain name)",
      "confidence": 0.0-1.0,
      "fields": { },
      "missing_fields": ["list", "of", "relevant", "missing", "keys"],
      "source_coverage": {
        "pages_covered": [page numbers with mapped content],
        "pages_with_no_mapped_content": [page numbers with no mapped content]
      }
    }
  ]
}

You MUST always return the top-level key: "domains" (array).

If the content of the page clearly belongs to a fitness / coaching plan, use domain type:
  "fitness_plan"

If the page is not fitness-related or you cannot confidently map it, use:
  - "generic_document" (for anything else), or
  - another suitable type such as "invoice", "resume", etc.

When you decide the current page is part of a fitness plan, you MUST structure its content under:

{
  "type": "fitness_plan",
  "confidence": <0.0–1.0>,
  "fields": {
    "meta": {
      "plan_name": string | null,
      "coach_name": string | null,
      "duration_weeks": number | null,
      "language": string | null,
      "target_gender": string | null,
      "target_level": string | null
    },
    "profile": {
      "age": number | null,
      "height_cm": number | null,
      "weight_kg": number | null,
      "body_fat_percent": number | null,
      "injuries": string[],
      "constraints": string[]
    },
    "goals": {
      "primary": string | null,
      "secondary": string[],
      "timeframe_weeks": number | null
    },
    "workouts": [
      {
        "name": string,              // e.g. "Push", "Legs", "Day 1 Chest-Triceps"
        "day_label": string | null,   // e.g. "Day 1", "Monday"
        "source_pages": number[],
        "exercises": [
          {
            "name": string,
            "sets": number | null,
            "reps": string | null,
            "rest_seconds": number | null,
            "tempo": string | null,
            "notes": string | null,
            "media_url": string | null,
            "source_pages": number[]
          }
        ]
      }
    ],
    "cardio": [
      {
        "name": string,
        "intensity": string | null,
        "duration_minutes": number | null,
        "frequency_per_week": number | null,
        "notes": string | null,
        "source_pages": number[]
      }
    ],
    "meals": [
      {
        "name": string,              // e.g. "Meal 1", "Breakfast", "Snack"
        "time": string | null,       // e.g. "08:00"
        "items": [
          {
            "name": string,
            "quantity": string | null,
            "calories_kcal": number | null,
            "protein_g": number | null,
            "carbs_g": number | null,
            "fats_g": number | null
          }
        ],
        "source_pages": number[]
      }
    ],
    "water_intake": {
      "recommended_liters_per_day": number | null,
      "notes": string | null,
      "source_pages": number[]
    },
    "supplements": [
      {
        "name": string,
        "dosage": string | null,
        "timing": string | null,
        "notes": string | null,
        "source_pages": number[]
      }
    ],
    "rehab_and_mobility": [
      {
        "name": string,
        "frequency_per_week": number | null,
        "notes": string | null,
        "source_pages": number[]
      }
    ],
    "stretching": [
      {
        "name": string,
        "duration_seconds": number | null,
        "notes": string | null,
        "source_pages": number[]
      }
    ]
  },
  "missing_fields": string[],
  "source_coverage": {
    "pages_covered": number[],
    "pages_with_no_mapped_content": number[]
  }
}

IMPORTANT RULES
----------------
- You receive ONLY ONE PAGE at a time.
- Use the provided page number when filling source_pages (1-based index).
- Do NOT invent data not present in the page.
- If some fields are not present on this page, leave them null / [] and add their keys to missing_fields.
- If the page is mostly general education text (e.g. guidelines, theory), you can put the main content into a notes field in an appropriate place, or treat it as a generic_document domain.
- Always return syntactically valid JSON.
- NEVER return markdown, comments, or text outside of the JSON.
`;

export default {
  async fetch(req, env) {
    const CORS = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "POST /parse only" }),
        { status: 405, headers: { "Content-Type": "application/json", ...CORS } }
      );
    }

    try {
      // Expect JSON from backend: { page_number, image_base64?, text? }
      let body;
      try {
        body = await req.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          { status: 400, headers: { "Content-Type": "application/json", ...CORS } }
        );
      }

      const { page_number, image_base64, text } = body || {};

      if (!page_number) {
        return new Response(
          JSON.stringify({ error: "Missing page_number" }),
          { status: 400, headers: { "Content-Type": "application/json", ...CORS } }
        );
      }

      if (!image_base64 && !text) {
        return new Response(
          JSON.stringify({ error: "Missing image_base64 or text" }),
          { status: 400, headers: { "Content-Type": "application/json", ...CORS } }
        );
      }

      // Build input for Responses API
      const inputContent = [
        { type: "input_text", text: PARSE_INSTRUCTIONS },
        { type: "input_text", text: `PAGE_NUMBER: ${page_number}` },
        { type: "input_text", text: `PAGE_TEXT:\n${text || "(No text extracted)"}` }
      ];

      if (image_base64) {
        inputContent.push({
          type: "input_image",
          image: image_base64
        });
      }

      const payload = {
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: inputContent
          }
        ],
        text: {
          format: { type: "json_object" }
        }
      };

      const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!openAIResponse.ok) {
        const errText = await openAIResponse.text();
        return new Response(
          JSON.stringify({ error: "OpenAI API error", details: errText }),
          { status: 502, headers: { "Content-Type": "application/json", ...CORS } }
        );
      }

      const respJson = await openAIResponse.json();

      // Responses API: prefer unified output_text if present
      let textOut = respJson.output_text;
      if (!textOut) {
        try {
          const chunks = respJson.output ?? [];
          const first = chunks.find(
            c => Array.isArray(c.content) && c.content[0]?.type === "output_text"
          );
          textOut = first?.content?.[0]?.text;
        } catch (e) {
          // ignore, handled below
        }
      }

      if (!textOut || typeof textOut !== "string") {
        return new Response(
          JSON.stringify({ error: "Empty or non-text model response", raw: respJson }),
          { status: 502, headers: { "Content-Type": "application/json", ...CORS } }
        );
      }

      // Parse JSON from text
      let json;
      try {
        json = JSON.parse(textOut);
      } catch (e) {
        // try to salvage a JSON block from the text
        const m = textOut.match(/\{[\s\S]*\}/);
        if (!m) {
          return new Response(
            JSON.stringify({ error: "Model returned non-JSON", raw: textOut }),
            { status: 502, headers: { "Content-Type": "application/json", ...CORS } }
          );
        }
        try {
          json = JSON.parse(m[0]);
        } catch (e2) {
          return new Response(
            JSON.stringify({ error: "Failed to parse salvaged JSON", raw: m[0] }),
            { status: 502, headers: { "Content-Type": "application/json", ...CORS } }
          );
        }
      }

      // Safety: ensure we always return an object with domains[] so backend doesn't crash
      if (!json || typeof json !== "object" || !Array.isArray(json.domains)) {
        json = {
          domains: [],
          raw: json
        };
      }

      return new Response(
        JSON.stringify(json),
        { status: 200, headers: { "Content-Type": "application/json", ...CORS } }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e?.message || "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS } }
      );
    }
  }
};
