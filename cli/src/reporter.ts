import chalk from "chalk";
import { ComparisonResult } from "./types";

export function printReport(results: ComparisonResult[]): number {
  let exitCode = 0;

  for (const r of results) {
    if (r.status === "MATCH") continue;

    console.log(chalk.bold(r.resourceKey), chalk.yellow(r.status));

    for (const d of r.differences) {
      console.log(
        " ",
        d.action === "FAIL" ? chalk.red("✗") : chalk.yellow("⚠"),
        d.path
      );
      if (d.action === "FAIL") exitCode = 2;
      if (d.action === "WARN" && exitCode === 0) exitCode = 1;
    }
  }

  if (exitCode === 0) {
    console.log(chalk.green("✓ All resources match"));
  }

  return exitCode;
}
