import fs from "fs";
import { Command } from "commander";
import { MODE, Mode } from "./domain/types";
import { printReport } from "./boundaries/reporter";
import { buildReport } from "./domain/buildReport";
import { validateInputs } from "./validation/cli";
import { runBootstrapComparison, runHelmManagedComparison, } from "./comparisonStrategies";


const program = new Command();

program
  .name("helm-guard")
  .requiredOption("--chart <path>", "Path to Helm chart")
  .requiredOption("--namespace <ns>", "Target namespace")
  .option("--mode <mode>", "Comparison mode: bootstrap or helm-managed", MODE.BOOTSTRAP)
  .option("--strict", "Strict (steady-state) mode", false)
  .option("--output <file>", "Write JSON report to file");

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
  console.error("helm-guard failed:", err instanceof Error ? err.message : err);
  process.exit(3);
}
