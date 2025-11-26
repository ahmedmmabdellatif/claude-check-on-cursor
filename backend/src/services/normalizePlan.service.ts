// normalizePlan.service.ts
// Normalizes UniversalFitnessPlan JSON into ProgramForTracking schema using OpenAI

import axios from 'axios';
import { UniversalFitnessPlan } from '../types/fitnessPlan';
import { ProgramForTracking } from '../../../shared/programTrackingSchema';
import { config } from '../config/env';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || config.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Normalizes a UniversalFitnessPlan into a ProgramForTracking schema
 * Uses OpenAI to intelligently reorganize and structure the content
 */
export async function normalizeParsedPlan(
  rawPlan: UniversalFitnessPlan,
  sourceFilename?: string
): Promise<ProgramForTracking> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const systemPrompt = `You are an expert fitness program analyzer. Your job is to convert a UniversalFitnessPlan JSON into a ProgramForTracking JSON.

CRITICAL RULES:
1. You receive a UniversalFitnessPlan JSON and must output a ProgramForTracking JSON that follows the TypeScript schema exactly.
2. Your job is to REORGANIZE and NORMALIZE the content into the ProgramForTracking schema.
3. You may move items from weird places to logical places (e.g., warmup described at end of PDF should become WarmupSection before workouts).
4. You MUST NOT discard any structured content; anything that doesn't fit goes into a logical section or an admin/education bucket.
5. Group workouts by day using weekly_schedule or day_label fields. If no day structure exists, create logical day groupings.
6. Extract tracking templates intelligently: if an exercise has sets/reps, enable trackSets/trackReps; if it has weight mentioned, enable trackWeightKg.
7. For cardio, extract duration, intensity, heart rate, and weekly progression if available.
8. For nutrition, organize meals by meal_number and create options/items structure.
9. For rehab, group by target_area and create TrackableExercise entries.
10. Preserve source references (page numbers, section hints) when possible.
11. Output ONLY valid JSON that matches the ProgramForTracking TypeScript interface. No markdown, no explanations.

ProgramForTracking Schema:
{
  meta: { title: string, subtitle?: string, author?: string, sourcePdfName?: string },
  profile: { traineeName: string, age?: string, gender?: string, heightCm?: string, weightKg?: string, location?: string, goals: string[], keyInjuries: string[], keyNotes: string[] },
  schedule: { logicalDays: ProgramDay[] },
  nutritionOverview?: { totalCalories?: number, macros?: { carbsG?: number, proteinG?: number, fatG?: number } },
  education?: EducationItem[],
  debugRef?: { sourcePlanType: "UniversalFitnessPlan", rawPlanId?: string }
}

ProgramDay: { id: string, label: string, tags: string[], sections: DaySection[] }
DaySection: WorkoutSection | CardioSection | NutritionSection | RehabSection | WarmupSection | EducationSection | AdminSection
WorkoutSection: { id: string, type: "workout", title: string, notes?: string, muscleGroups: string[], exercises: TrackableExercise[] }
TrackableExercise: { id: string, name: string, sets: number | null, reps: string | null, tempo?: string | null, restSeconds?: number | null, equipment?: string | null, muscles?: string[], mediaLinks?: string[], sourceRefs?: SourceRef[], trackingTemplate: { trackWeightKg?: boolean, trackReps?: boolean, trackSets?: boolean, trackTempo?: boolean, trackRpe?: boolean, trackCompletedCheckbox?: boolean } }
CardioSection: { id: string, type: "cardio", title: string, notes?: string, sessions: [{ name: string, durationMinutes: number | null, intensity?: string | null, heartRateRange?: string | null, weeklyProgressionNote?: string | null, trackingTemplate: { trackDuration?: boolean, trackDistance?: boolean, trackRpe?: boolean, trackCompletedCheckbox?: boolean } }] }
NutritionSection: { id: string, type: "nutrition", title: string, notes?: string, meals: [{ id: string, label: string, options: [{ id: string, label: string, items: [{ name: string, amount?: string }] }], trackingTemplate: { trackCompletedCheckbox?: boolean, trackPortionMultiplier?: boolean } }] }
RehabSection: { id: string, type: "rehab", title: string, notes?: string, targetArea: string, exercises: TrackableExercise[] }
WarmupSection: { id: string, type: "warmup", title: string, notes?: string, exercises: TrackableExercise[] }
EducationSection: { id: string, type: "education", title: string, notes?: string, items: [{ title?: string, text: string, sourceRefs?: SourceRef[] }] }
AdminSection: { id: string, type: "admin", title: string, notes?: string, items: [{ title: string, text: string }] }
SourceRef: { pageNumber?: number, sectionHint?: string }`;

  const userPrompt = `Convert this UniversalFitnessPlan JSON into a ProgramForTracking JSON:

${JSON.stringify(rawPlan, null, 2)}

${sourceFilename ? `Source PDF filename: ${sourceFilename}` : ''}

Output ONLY the ProgramForTracking JSON object, no other text.`;

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini', // Using cheaper model for JSON-to-JSON transformation
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more deterministic output
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds timeout
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    let normalizedPlan: ProgramForTracking;
    try {
      normalizedPlan = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        normalizedPlan = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError}`);
      }
    }

    // Basic validation
    if (!normalizedPlan.meta || !normalizedPlan.meta.title) {
      throw new Error('Invalid ProgramForTracking: missing meta.title');
    }
    if (!normalizedPlan.profile || !normalizedPlan.profile.traineeName) {
      throw new Error('Invalid ProgramForTracking: missing profile.traineeName');
    }
    if (!normalizedPlan.schedule || !Array.isArray(normalizedPlan.schedule.logicalDays)) {
      throw new Error('Invalid ProgramForTracking: missing schedule.logicalDays array');
    }

    return normalizedPlan;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Normalization failed: ${error.message}`);
  }
}

