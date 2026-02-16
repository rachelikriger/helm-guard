import { z } from 'zod';
import type { HelmGuardReport } from './reportContract';

const diffActionSchema = z.enum(['WARN', 'FAIL']);
const resourceStatusSchema = z.enum(['MATCH', 'DRIFT', 'MISSING_LIVE', 'MISSING_HELM']);
const modeSchema = z.enum(['bootstrap', 'helm-managed']);

const reportConfigSchema = z.object({
    helmChart: z.string(),
    namespace: z.string(),
    strictMode: z.boolean(),
    mode: modeSchema,
    releaseName: z.string().optional(),
    valuesFiles: z.array(z.string()).optional(),
    whitelistedKinds: z.array(z.string()).optional(),
});

const reportSummarySchema = z.object({
    total: z.number(),
    matched: z.number(),
    drifted: z.number(),
    missingLive: z.number(),
    missingHelm: z.number(),
    warnings: z.number(),
    failures: z.number(),
});

const diffItemSchema = z.object({
    path: z.string(),
    helmValue: z.unknown().optional(),
    liveValue: z.unknown().optional(),
    action: diffActionSchema,
});

const resourceResultSchema = z.object({
    resourceKey: z.string(),
    status: resourceStatusSchema,
    differences: z.array(diffItemSchema),
});

export const reportSchema = z.object({
    schemaVersion: z.literal(1),
    timestamp: z.string(),
    config: reportConfigSchema,
    summary: reportSummarySchema,
    results: z.array(resourceResultSchema),
});

export type SafeParseReportSuccess = { success: true; data: HelmGuardReport };
export type SafeParseReportFailure = { success: false; error: z.ZodError };

export const safeParseReport = (data: unknown): SafeParseReportSuccess | SafeParseReportFailure => {
    const result = reportSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data as HelmGuardReport };
    }
    return { success: false, error: result.error };
};
