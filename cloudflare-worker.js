// Cloudflare Worker - Universal Fitness PDF Parser (v5.3+max_output)
// Endpoint example: https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/
// CONTRACT (STRICT):
//   - Accepts JSON from backend:
//       { pdf_base64: string, filename?: string }
//   - Rejects any request that contains: page_number, text, image_base64, or other legacy fields.
//   - Sends the ENTIRE PDF to OpenAI Responses API in ONE call.
//   - Returns the model JSON as-is (UniversalFitnessPlan with debug.pages[] for all pages).
//
// RESPONSIBILITIES:
//   - CORS handling
//   - Basic validation
//   - PDF base64 normalization to data URI
//   - Build JSON payload for OpenAI
//   - Forward response back to caller
//
// NO PAGE-BY-PAGE MODE. NO MERGING. NO PARTIAL JSON.

const UNIVERSAL_PARSE_INSTRUCTIONS = `
You are an expert document analyst specialized in fitness, training, rehabilitation, nutrition, and health documents.

YOUR PRIMARY GOALS:
1. Parse EVERY page of the PDF fully. No skipping.
2. Do NOT summarize any structured data.
3. Only motivational content may be summarized lightly.
4. If schema has no place → store the content in "unclassified".
5. If page contains only images → describe them in detail.
6. Extract ALL text, ALL bullet points, ALL tables, ALL instructions.
7. Every page must appear in debug.pages[].
8. Repeated content must stay repeated.
9. Do not hallucinate missing values.
10. JSON must always follow the schema EXACTLY.

UNIVERSAL FITNESS JSON SCHEMA (EXTREMELY WIDE):

{
    "meta": {
    "title": "",
    "subtitle": "",
    "author": "",
    "creation_date": "",
    "source": ""
  },

    "profile": {
    "trainee_name": "",
    "age": "",
    "gender": "",
    "height_cm": "",
    "weight_kg": "",
    "location": "",
    "goals": [],
    "notes": []
  },

  "assessment_and_background": {
    "demographics": {},
    "health_status": {
      "medical_conditions": [],
      "injuries": [],
      "pain_points": [],
      "posture_issues": [],
      "mobility_limitations": [],
      "rehab_history": []
    },
    "fitness_status": {
      "experience_level": "",
      "training_history": "",
      "weak_points": [],
      "strong_points": []
    },
    "monitoring_and_tracking": {
      "body_measurements": [],
      "weekly_metrics": [],
      "progress_evaluation": []
    },
    "behavior_and_psychology": {
      "motivation_notes": [],
      "adherence_notes": [],
      "mindset_notes": []
    }
  },

  "warmup_protocols": [],
  "mobility_and_rehab": [],
  "stretching_routines": [],
  "cardio_sessions": [],
  "weekly_schedule": [],
  "workouts": [],
  "nutrition_plan": [],
  "food_sources": {},
  "education_and_guidelines": [],
  "other_information": [],
  "unclassified": [],

  "debug": {
    "pages": []
  }
}

PAGE-BY-PAGE DEBUG FORMAT (FOR THE FULL PDF):

For EACH page in the PDF, include in debug.pages[]:

{
  "page_number": X,
  "raw_text": "<extract ALL text from this page exactly>",
  "detected_elements": [],
  "mapped_to": [],
  "notes": "Short classification only"
}

CONTENT HANDLING:

Exercises:
- name, sets, reps, tempo, rest, equipment, muscles, instructions, media links

Mobility/Rehab:
- target area, purpose, steps, frequency, variations

Cardio:
- type, duration, intensity, frequency, heart rate, weekly progression

Nutrition:
- meals, options, ingredients, gram amounts, notes, restrictions

Food Sources:
- classify proteins, carbs, fats, fruits, salads, vegetables, drinks, supplements

Education:
- full long text extraction

Unknown content:
- push into unclassified EXACTLY as-is

FINAL OUTPUT:
Return ONE JSON object following the schema above with ALL pages processed.
No text outside JSON.
`;

export default {
  async fetch(req, env) {
    const CORS = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // Only POST allowed
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "POST only" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json", ...CORS }
        }
      );
    }

    try {
      const ct = req.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        return new Response(
          JSON.stringify({ error: "Expected JSON input" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS }
          }
        );
      }

      const body = await req.json();

      // HARD GUARD: reject any legacy page-based fields to enforce full-PDF contract.
      if (
        Object.prototype.hasOwnProperty.call(body, "page_number") ||
        Object.prototype.hasOwnProperty.call(body, "text") ||
        Object.prototype.hasOwnProperty.call(body, "image_base64")
      ) {
        return new Response(
          JSON.stringify({
            error:
              "Invalid payload: this worker only accepts { pdf_base64: string, filename?: string }. " +
              "Do NOT send page_number, text, or image_base64. Backend must NOT split the PDF."
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS }
          }
        );
      }

      const pdfBase64 = body.pdf_base64;
      const filename =
        typeof body.filename === "string" && body.filename.trim().length > 0
          ? body.filename.trim()
          : "fitness-plan.pdf";

      if (!pdfBase64 || typeof pdfBase64 !== "string") {
        return new Response(
          JSON.stringify({
            error: "Missing required field: pdf_base64 (string)",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS }
          }
        );
      }

      // Normalize to full data URI if caller passed raw base64 only
      const fileData = pdfBase64.startsWith("data:")
        ? pdfBase64
        : `data:application/pdf;base64,${pdfBase64}`;

      const payload = {
        model: "gpt-4.1", // Full model with PDF (text + image) support
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file",
                filename,
                file_data: fileData
              },
              {
                type: "input_text",
                text: UNIVERSAL_PARSE_INSTRUCTIONS
              }
            ]
          }
        ],
        // Force JSON object output
        text: {
          format: { type: "json_object" }
        },
        // NEW: cap output tokens to reduce total requested tokens
        max_output_tokens: 6000
      };

      const openaiRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!openaiRes.ok) {
        const raw = await openaiRes.text();
        return new Response(
          JSON.stringify({
            error: "OpenAI error",
            status: openaiRes.status,
            body: raw
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json", ...CORS }
          }
        );
      }

      const modelJson = await openaiRes.json();

      // Extract JSON text from Responses API result
      let output = modelJson.output_text;

      if (!output) {
        if (Array.isArray(modelJson.output)) {
          const first = modelJson.output.find(
            (c) => Array.isArray(c.content) && c.content[0]?.type === "output_text"
          );
          if (first && first.content && first.content[0]) {
            output = first.content[0].text;
          }
        } else if (typeof modelJson.output === "string") {
          output = modelJson.output;
        }
      }

      if (!output) {
        return new Response(
          JSON.stringify({ error: "Empty model output", raw: modelJson }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS }
          }
        );
      }

      let json;
      try {
        json = JSON.parse(output);
      } catch (e) {
        // Fallback: try to extract the first JSON object substring
        const m = output.match(/\{[\s\S]*\}/);
        if (!m) {
          throw e;
        }
          json = JSON.parse(m[0]);
      }

      if (!json || typeof json !== "object") {
        return new Response(
          JSON.stringify({
            error: "Invalid response structure",
          raw: json
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS }
          }
        );
      }

      return new Response(
        JSON.stringify(json),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS }
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: err && err.message ? err.message : "Server error"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS }
        }
      );
    }
  }
};
