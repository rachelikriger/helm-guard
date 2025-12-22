import { Command } from "commander";
import { renderHelmChart } from "./helm";
import { fetchLiveResources } from "./openshift";
import { compareResources } from "./comparator";
import { printReport } from "./reporter";

const program = new Command();

program
  .name("helm-guard")
  .requiredOption("--chart <path>", "Path to Helm chart")
  .requiredOption("--namespace <ns>", "Target namespace")
  .option("--strict", "Strict (steady-state) mode", false);

program.parse();
const opts = program.opts();

const helmResources = renderHelmChart(opts.chart, opts.namespace);
const liveResources = fetchLiveResources(opts.namespace);

const results = compareResources(
  helmResources,
  liveResources,
  opts.strict
);

const exitCode = printReport(results);
process.exit(exitCode);
