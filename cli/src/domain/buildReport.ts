import {
    ComparisonResult,
    CountableAction,
    DIFF_ACTION,
    HelmGuardReport,
    ReportConfig,
    ReportSummary,
    ResourceStatus,
} from './types';

export const buildReport = (results: ComparisonResult[], config: ReportConfig): HelmGuardReport => {
    const summary: ReportSummary = {
        total: results.length,
        matched: countByStatus(results, ResourceStatus.MATCH),
        drifted: countByStatus(results, ResourceStatus.DRIFT),
        missingLive: countByStatus(results, ResourceStatus.MISSING_LIVE),
        missingHelm: countByStatus(results, ResourceStatus.MISSING_HELM),
        warnings: countByAction(results, DIFF_ACTION.WARN),
        failures:
            countByAction(results, DIFF_ACTION.FAIL) +
            countByStatus(results, ResourceStatus.MISSING_LIVE) +
            countByStatus(results, ResourceStatus.MISSING_HELM),
    };

    return {
        schemaVersion: 1,
        timestamp: new Date().toISOString(),
        config,
        summary,
        results,
    };
};

const countByStatus = (results: ComparisonResult[], status: ResourceStatus): number => {
    return results.filter(r => r.status === status).length;
};

const countByAction = (results: ComparisonResult[], action: CountableAction): number => {
    return results.flatMap(r => r.differences).filter(d => d.action === action).length;
};
