/*
 * MergeService: Aggregates page-level Universal Fitness JSON objects into one final plan.
 * This is a TEMPORARY service until Worker v4.0 is deployed.
 * Once Worker v4.0 handles merging internally, this service will be removed.
 */

import {
    UniversalFitnessPlan,
} from '../types/fitnessPlan';

type UniversalPlan = UniversalFitnessPlan;

export class MergeService {

    createEmptyUniversalPlan(): UniversalPlan {
        return {
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
    }

    mergePageResults(pageResults: UniversalFitnessPlan[]): UniversalPlan {
        return this.mergePages(pageResults);
    }

    mergePages(pages: UniversalFitnessPlan[]): UniversalPlan {
        const plan = this.createEmptyUniversalPlan();

        for (const page of pages) {
            if (!page) continue;

            // Merge meta & profile
            this.mergeMeta(plan.meta, page.meta);
            this.mergeProfile(plan.profile, page.profile);

            // Merge assessment & background
            this.mergeAssessment(plan.assessment_and_background, page.assessment_and_background);

            // Concatenate arrays
            if (page.warmup_protocols) plan.warmup_protocols!.push(...page.warmup_protocols);
            if (page.mobility_and_rehab) plan.mobility_and_rehab!.push(...page.mobility_and_rehab);
            if (page.stretching_routines) plan.stretching_routines!.push(...page.stretching_routines);
            if (page.cardio_sessions) plan.cardio_sessions!.push(...page.cardio_sessions);
            if (page.weekly_schedule) plan.weekly_schedule!.push(...page.weekly_schedule);
            if (page.workouts) plan.workouts!.push(...page.workouts);
            if (page.nutrition_plan) plan.nutrition_plan!.push(...page.nutrition_plan);
            if (page.education_and_guidelines) plan.education_and_guidelines!.push(...page.education_and_guidelines);
            if (page.other_information) plan.other_information!.push(...page.other_information);
            if (page.unclassified) plan.unclassified!.push(...page.unclassified);

            // Merge food_sources
            if (page.food_sources) {
                plan.food_sources = {
                    ...(plan.food_sources || {}),
                    ...page.food_sources
                };
            }

            // Merge debug.pages - ensure page_number is preserved
            if (page.debug && Array.isArray(page.debug.pages)) {
                for (const debugPage of page.debug.pages) {
                    // Ensure page_number is set correctly
                    if (debugPage && typeof debugPage === 'object') {
                        plan.debug!.pages.push(debugPage);
                    }
                }
            }
        }

        console.log("[Merge] Result counts:", {
            workouts: plan.workouts!.length,
            meals: plan.nutrition_plan!.length,
            cardio: plan.cardio_sessions!.length,
            mobility_rehab: plan.mobility_and_rehab!.length,
            stretching: plan.stretching_routines!.length,
            education: plan.education_and_guidelines!.length,
            other: plan.other_information!.length,
            unclassified: plan.unclassified!.length,
            debug_pages: plan.debug!.pages.length
        });

        return plan;
    }

    private mergeMeta(target: any, source: any) {
        if (!source) return;
        for (const key in source) {
            if (source[key] && !target[key]) {
                target[key] = source[key];
            }
        }
    }

    private mergeProfile(target: any, source: any) {
        if (!source) return;
        for (const key in source) {
            if (Array.isArray(source[key])) {
                if (!target[key]) target[key] = [];
                target[key].push(...source[key]);
            } else if (source[key] && !target[key]) {
                target[key] = source[key];
            }
        }
    }

    private mergeAssessment(target: any, source: any) {
        if (!source) return;

        if (source.health_status) {
            if (!target.health_status) target.health_status = {};
            this.mergeObjectArrays(target.health_status, source.health_status);
        }
        if (source.fitness_status) {
            if (!target.fitness_status) target.fitness_status = {};
            this.mergeObjectArrays(target.fitness_status, source.fitness_status);
        }
        if (source.monitoring_and_tracking) {
            if (!target.monitoring_and_tracking) target.monitoring_and_tracking = {};
            this.mergeObjectArrays(target.monitoring_and_tracking, source.monitoring_and_tracking);
        }
        if (source.behavior_and_psychology) {
            if (!target.behavior_and_psychology) target.behavior_and_psychology = {};
            this.mergeObjectArrays(target.behavior_and_psychology, source.behavior_and_psychology);
        }

        if (source.demographics) {
            target.demographics = { ...target.demographics, ...source.demographics };
        }
    }

    private mergeObjectArrays(target: any, source: any) {
        for (const key in source) {
            if (Array.isArray(source[key])) {
                if (!target[key]) target[key] = [];
                target[key].push(...source[key]);
            } else if (source[key] && !target[key]) {
                target[key] = source[key];
            }
        }
    }
}

export const mergeService = new MergeService();
