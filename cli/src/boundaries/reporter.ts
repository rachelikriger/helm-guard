import chalk from "chalk";
import { ComparisonResult, DIFF_ACTION, RESOURCE_STATUS } from "../domain/types";
import { classifyResourceKey } from "../../../shared/resource-scope";

const FAIL_MARK = chalk.red("x");
const WARN_MARK = chalk.yellow("~");

export const printReport = (
  results: ComparisonResult[],
  defaultNamespace?: string
): number => {
  let exitCode = 0;

  for (const r of results) {
    if (r.status === RESOURCE_STATUS.MATCH) continue;
    const scope = classifyResourceKey(r.resourceKey, defaultNamespace).scope;
    const isClusterScoped = scope === "cluster";

    if (!isClusterScoped) {
      if (
        r.status === RESOURCE_STATUS.MISSING_LIVE ||
        r.status === RESOURCE_STATUS.MISSING_HELM
      ) {
        exitCode = Math.max(exitCode, 2);
      }
    }

    const scopeNote = isClusterScoped
      ? chalk.gray(" (cluster-scoped, informational)")
      : "";
    console.log(chalk.bold(r.resourceKey) + scopeNote, chalk.yellow(r.status));

    for (const d of r.differences) {
      const marker = d.action === DIFF_ACTION.FAIL ? FAIL_MARK : WARN_MARK;
      console.log(" ", marker, d.path);
      if (!isClusterScoped) {
        if (d.action === DIFF_ACTION.FAIL) exitCode = 2;
        if (d.action === DIFF_ACTION.WARN && exitCode === 0) exitCode = 1;
      }
    }
  }

  if (exitCode === 0) {
    console.log(chalk.green("All resources match"));
  }

  return exitCode;
};
