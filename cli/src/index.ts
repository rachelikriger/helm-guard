import { Command } from "commander";
import fs from "fs";
import { printReport } from "./reporter";
import { buildReport } from "./buildReport";
import {
  runBootstrapComparison,
  runHelmManagedComparison,
} from "./comparisonStrategies";
import { Mode } from "./types";

const program = new Command();

program
  .name("helm-guard")
  .requiredOption("--chart <path>", "Path to Helm chart")
  .requiredOption("--namespace <ns>", "Target namespace")
  .option("--mode <mode>", "Comparison mode: bootstrap or helm-managed", "bootstrap")
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
    mode === "bootstrap" ? runBootstrapComparison : runHelmManagedComparison;

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

function validateInputs(
  chart: string,
  namespace: string,
  mode?: Mode | string
): Mode {
  if (!chart || !fs.existsSync(chart)) {
    console.error(`Chart path does not exist: ${chart}`);
    process.exit(3);
  }

  if (!namespace || !namespace.trim()) {
    console.error("Namespace is required and cannot be empty");
    process.exit(3);
  }

  const modeValue = mode ?? "bootstrap";
  if (modeValue === "bootstrap" || modeValue === "helm-managed") {
    return modeValue;
  }

  console.error('Mode must be either "bootstrap" or "helm-managed"');
  process.exit(3);
}
