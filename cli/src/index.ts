import { Command } from "commander";
import fs from "fs";
import { renderHelmChart } from "./helm";
import { fetchLiveResources } from "./openshift";
import { compareResources } from "./comparator";
import { printReport } from "./reporter";
import { buildReport } from "./buildReport";

const program = new Command();

program
  .name("helm-guard")
  .requiredOption("--chart <path>", "Path to Helm chart")
  .requiredOption("--namespace <ns>", "Target namespace")
  .option("--strict", "Strict (steady-state) mode", false)
  .option("--output <file>", "Write JSON report to file");

try {
  program.parse();
  const opts = program.opts<{
    chart: string;
    namespace: string;
    strict: boolean;
    output?: string;
  }>();

  if (!fs.existsSync(opts.chart)) {
    console.error(`Chart path does not exist: ${opts.chart}`);
    process.exit(3);
  }

  const helmResources = renderHelmChart(opts.chart, opts.namespace);
  const liveResources = fetchLiveResources(opts.namespace);

  const results = compareResources(
    helmResources,
    liveResources,
    opts.strict
  );

  if (opts.output) {
    const report = buildReport(results, {
      helmChart: opts.chart,
      namespace: opts.namespace,
      strictMode: opts.strict,
    });
    fs.writeFileSync(opts.output, JSON.stringify(report, null, 2));
  }

  const exitCode = printReport(results);
  process.exit(exitCode);
} catch (err) {
  console.error("helm-guard failed:", err instanceof Error ? err.message : err);
  process.exit(3);
}
