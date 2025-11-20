import {
  PageParseResponse,
  UniversalFitnessPlan,
  Debug,
  PageSummary,
} from '../types/fitnessPlan';

export class MergeService {
  mergePageResults(pageResults: PageParseResponse[]): UniversalFitnessPlan {
    const mergeStart = Date.now();
    console.log(`[Merge Service] Merging ${pageResults.length} page results...`);

    const mergedPlan: UniversalFitnessPlan = {
      meta: {},
      profile: {
        trainee_name: '', age: '', gender: '',
        height_cm: '', weight_kg: '', location: '',
        goals: [], notes: []
      },
      assessment_and_background: {
        demographics: {},
        health_status: {
          medical_conditions: [], injuries: [], pain_points: [],
          posture_issues: [], mobility_limitations: [], rehab_history: []
        },
        fitness_status: {
          experience_level: '', training_history: '',
          weak_points: [], strong_points: []
        },
        monitoring_and_tracking: {
          body_measurements: [], weekly_metrics: [], progress_evaluation: []
        },
        behavior_and_psychology: {
          motivation_notes: [], adherence_notes: [], mindset_notes: []
        }
      },
      warmup_protocols: [],
      mobility_and_rehab: [],
      stretching_routines: [],
      cardio_sessions: [],
      weekly_schedule: [],
      workouts: [],
      nutrition_plan: [],
      food_sources: {},
      education_and_guidelines: [],
      other_information: [],
      unclassified: [],
      debug: { pages: [] }
    };

    for (const pageResult of pageResults) {
      // Merge debug info
      if (pageResult.debug && pageResult.debug.pages) {
        mergedPlan.debug!.pages.push(...pageResult.debug.pages);
      }

      // Merge meta (shallow merge, last wins)
      if (pageResult.meta) {
        mergedPlan.meta = { ...mergedPlan.meta, ...pageResult.meta };
      }

      // Merge profile (shallow merge of fields)
      if (pageResult.profile) {
        // Merge scalar fields
        mergedPlan.profile = { ...mergedPlan.profile, ...pageResult.profile };

        // Merge arrays if they exist in the new page
        if (pageResult.profile.goals) {
          mergedPlan.profile!.goals = [...(mergedPlan.profile!.goals || []), ...pageResult.profile.goals];
        }
        if (pageResult.profile.notes) {
          mergedPlan.profile!.notes = [...(mergedPlan.profile!.notes || []), ...pageResult.profile.notes];
        }
      }

      // Merge assessment_and_background (deep merge for arrays, shallow for objects)
      if (pageResult.assessment_and_background) {
        const target = mergedPlan.assessment_and_background!;
        const source = pageResult.assessment_and_background;

        if (source.health_status) {
          target.health_status = { ...target.health_status, ...source.health_status };
          // Arrays inside health_status need to be concatenated if we want to be perfect, 
          // but shallow merge of the object might overwrite. 
          // Let's do a smarter merge for health_status arrays
          for (const key of ['medical_conditions', 'injuries', 'pain_points', 'posture_issues', 'mobility_limitations', 'rehab_history']) {
            if (source.health_status[key]) {
              target.health_status![key] = [...(target.health_status![key] || []), ...source.health_status[key]];
            }
          }
        }

        // Similar logic for other subsections can be added, but for now let's stick to the main arrays which are critical
      }

      // Merge food_sources (Deep merge: combine lists under each key)
      if (pageResult.food_sources) {
        for (const [key, value] of Object.entries(pageResult.food_sources)) {
          const existingValue = mergedPlan.food_sources![key];

          if (Array.isArray(existingValue) && Array.isArray(value)) {
            // Combine arrays
            mergedPlan.food_sources![key] = [...existingValue, ...value];
          } else if (!existingValue) {
            // Add new key
            mergedPlan.food_sources![key] = value;
          }
        }
      }

      // Merge Arrays by concatenation
      if (pageResult.workouts) {
        mergedPlan.workouts!.push(...pageResult.workouts);
      }

      if (pageResult.warmup_protocols) {
        mergedPlan.warmup_protocols!.push(...pageResult.warmup_protocols);
      }

      if (pageResult.mobility_and_rehab) {
        mergedPlan.mobility_and_rehab!.push(...pageResult.mobility_and_rehab);
      }

      if (pageResult.stretching_routines) {
        mergedPlan.stretching_routines!.push(...pageResult.stretching_routines);
      }

      if (pageResult.cardio_sessions) {
        mergedPlan.cardio_sessions!.push(...pageResult.cardio_sessions);
      }

      if (pageResult.weekly_schedule) {
        mergedPlan.weekly_schedule!.push(...pageResult.weekly_schedule);
      }

      if (pageResult.nutrition_plan) {
        mergedPlan.nutrition_plan!.push(...pageResult.nutrition_plan);
      }

      if (pageResult.education_and_guidelines) {
        mergedPlan.education_and_guidelines!.push(...pageResult.education_and_guidelines);
      }

      if (pageResult.other_information) {
        mergedPlan.other_information!.push(...pageResult.other_information);
      }

      if (pageResult.unclassified) {
        mergedPlan.unclassified!.push(...pageResult.unclassified);
      }
    }

    const mergeEnd = Date.now();
    console.log(`[MergeService] Merge completed in ${mergeEnd - mergeStart} ms`);
    console.log(`[Merge Service] Merge complete. Pages: ${mergedPlan.debug?.pages.length}, Workouts: ${mergedPlan.workouts?.length}, Meals: ${mergedPlan.nutrition_plan?.length}`);
    return mergedPlan;
  }
}

export const mergeService = new MergeService();
