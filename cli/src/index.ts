import fs from "fs";
import { Command } from "commander";
import { MODE, Mode } from "./domain/types";
import type { ReportConfig } from "./domain/types";
import { printReport } from "./boundaries/reporter";
import { buildReport } from "./domain/buildReport";
import { validateHelmRenderOptions, validateInputs } from "./validation/cli";
import { runBootstrapComparison, runHelmManagedComparison } from "./comparisonStrategies";

type CliOptions = {
  chart: string;
  namespace: string;
  mode?: Mode | string;
  strict: boolean;
  release?: string;
  values: string[];
  output?: string;
};

const program = new Command();

program
  .name("helm-guard")
  .requiredOption("--chart <path>", "Path to Helm chart")
  .requiredOption("--namespace <ns>", "Target namespace")
  .option("--mode <mode>", "Comparison mode: bootstrap or helm-managed", MODE.BOOTSTRAP)
  .option("--strict", "Strict (steady-state) mode", false)
  .option("--release <name>", "Helm release name")
  .option(
    "--values <file>",
    "Helm values file (repeatable)",
    (value: string, previous: string[]) => [...previous, value],
    []
  )
  .option("--output <file>", "Write JSON report to file");

const formatErrorMessage = (message: string): string => {
  if (message.startsWith("Invalid CLI input:")) {
    return `helm-guard input error: ${message}`;
  }
  return `helm-guard failed: ${message}`;
};

try {
  program.parse();
  const opts = program.opts<CliOptions>();

  const mode = validateInputs(opts.chart, opts.namespace, opts.mode);
  const helmRenderOptions = validateHelmRenderOptions(opts.release, opts.values);
  const runComparison =
    mode === MODE.BOOTSTRAP ? runBootstrapComparison : runHelmManagedComparison;

  const results = runComparison({
    chart: opts.chart,
    namespace: opts.namespace,
    strict: opts.strict,
    helmRenderOptions,
  });

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

    const report = buildReport(results, reportConfig);
    fs.writeFileSync(opts.output, JSON.stringify(report, null, 2));
  }

  const exitCode = printReport(results, opts.namespace);
  process.exit(exitCode);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  const output = formatErrorMessage(message);
  console.error(output);
  process.exit(3);
}
