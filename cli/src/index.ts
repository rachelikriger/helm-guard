import fs from 'fs';
import { Command } from 'commander';
import type { CliOptions, ComparisonParams, ReportConfig } from './domain/types';
import { MODE, Mode } from './domain/types';
import { printReport } from './boundaries/reporter';
import { buildReport } from './domain/buildReport';
import { parseMode, validateChartAndNamespace, validateHelmRenderOptions } from './validation/cli';
import { runBootstrapComparison, runHelmManagedComparison } from './comparisonStrategies';

const program = new Command();

program
    .name('helm-guard')
    .requiredOption('--chart <path>', 'Path to Helm chart')
    .requiredOption('--namespace <ns>', 'Target namespace')
    .option('--mode <mode>', 'Comparison mode: bootstrap or helm-managed', MODE.BOOTSTRAP)
    .option('--strict', 'Strict (steady-state) mode', false)
    .option('--release <name>', 'Helm release name')
    .option(
        '--values <file>',
        'Helm values file (repeatable)',
        (value: string, previous: string[]) => [...previous, value],
        [],
    )
    .option(
        '--set <key=value>',
        'Helm set value (repeatable)',
        (value: string, previous: string[]) => [...previous, value],
        [],
    )
    .option('--output <file>', 'Write JSON report to file');

const formatErrorMessage = (message: string): string => {
    if (message.startsWith('Invalid CLI input:')) {
        return `helm-guard input error: ${message}`;
    }
    return `helm-guard failed: ${message}`;
};

const main = async (): Promise<void> => {
    try {
        program.parse();
        const opts = program.opts<CliOptions>();

        validateChartAndNamespace(opts.chart, opts.namespace);
        const mode = parseMode(opts.mode);
        const helmRenderOptions = validateHelmRenderOptions(opts.release, opts.values, opts.set);
        const runComparison = mode === MODE.BOOTSTRAP ? runBootstrapComparison : runHelmManagedComparison;
        const comparisonParams: ComparisonParams = {
            chart: opts.chart,
            namespace: opts.namespace,
            strict: opts.strict,
            helmRenderOptions,
        };
        const outcome = await runComparison(comparisonParams);

        if (opts.output) {
            const reportConfig: ReportConfig = {
                helmChart: opts.chart,
                namespace: opts.namespace,
                strictMode: opts.strict,
                mode,
            };

            if (helmRenderOptions.releaseName) {
                reportConfig.releaseName = helmRenderOptions.releaseName;
            }

            if (helmRenderOptions.valuesFiles && helmRenderOptions.valuesFiles.length > 0) {
                reportConfig.valuesFiles = helmRenderOptions.valuesFiles;
            }

            reportConfig.whitelistedKinds = outcome.whitelistedKinds;

            const report = buildReport(outcome.results, reportConfig);
            fs.writeFileSync(opts.output, JSON.stringify(report, null, 2));
        }

        const exitCode = printReport(outcome.results, opts.namespace);
        process.exit(exitCode);

    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const output = formatErrorMessage(message);
        console.error(output);
        process.exit(3);
    }
};

void main();
