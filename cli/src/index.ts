import fs from "fs";
import { Command } from "commander";
import { MODE, Mode } from "./domain/types";
import { printReport } from "./boundaries/reporter";
import { buildReport } from "./domain/buildReport";
import { validateInputs } from "./validation/cli";
import { runBootstrapComparison, runHelmManagedComparison } from "./comparisonStrategies";

const program = new Command();

program
  .name("helm-guard")
  .requiredOption("--chart <path>", "Path to Helm chart")
  .requiredOption("--namespace <ns>", "Target namespace")
  .option("--mode <mode>", "Comparison mode: bootstrap or helm-managed", MODE.BOOTSTRAP)
  .option("--strict", "Strict (steady-state) mode", false)
  .option("--output <file>", "Write JSON report to file");

const formatErrorMessage = (message: string): string => {
  if (message.startsWith("Invalid CLI input:")) {
    return `helm-guard input error: ${message}`;
  }
  return `helm-guard failed: ${message}`;
};

try {
  program.parse();
  const opts = program.opts<{
    chart: string;
    namespace: string;
    mode?: Mode | string;
    strict: boolean;
    output?: string;
  }>();

  const mode = validateInputs(opts.chart, opts.namespace, opts.mode);
  const runComparison =
    mode === MODE.BOOTSTRAP ? runBootstrapComparison : runHelmManagedComparison;

  const results = runComparison({
    chart: opts.chart,
    namespace: opts.namespace,
    strict: opts.strict,
  });

  if (opts.output) {
    const report = buildReport(results, {
      helmChart: opts.chart,
      namespace: opts.namespace,
      strictMode: opts.strict,
      mode,
    });
    fs.writeFileSync(opts.output, JSON.stringify(report, null, 2));
  }

  const exitCode = printReport(results);
  process.exit(exitCode);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  const output = formatErrorMessage(message);
  console.error(output);
  process.exit(3);
}
