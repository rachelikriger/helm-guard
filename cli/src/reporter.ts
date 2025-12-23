import chalk from "chalk";
import { ComparisonResult } from "./types";

const FAIL_MARK = chalk.red("x");
const WARN_MARK = chalk.yellow("~");

export function printReport(results: ComparisonResult[]): number {
  let exitCode = 0;

  for (const r of results) {
    if (r.status === "MATCH") continue;

    if (r.status === "MISSING_LIVE" || r.status === "MISSING_HELM") {
      exitCode = Math.max(exitCode, 2);
    }

    console.log(chalk.bold(r.resourceKey), chalk.yellow(r.status));

    for (const d of r.differences) {
      const marker = d.action === "FAIL" ? FAIL_MARK : WARN_MARK;
      console.log(" ", marker, d.path);
      if (d.action === "FAIL") exitCode = 2;
      if (d.action === "WARN" && exitCode === 0) exitCode = 1;
    }
  }

  if (exitCode === 0) {
    console.log(chalk.green("All resources match"));
  }

  return exitCode;
}
