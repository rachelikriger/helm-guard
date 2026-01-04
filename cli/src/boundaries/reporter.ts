import chalk from "chalk";
import {
  ComparisonResult,
  DIFF_ACTION,
  DiffPath,
  RESOURCE_STATUS,
  ResourceIdentifier,
} from "../domain/types";
const FAIL_MARK = chalk.red("x");
const WARN_MARK = chalk.yellow("~");

export const printReport = (
  results: ComparisonResult[],
  defaultNamespace?: string
): number => {
  let exitCode = 0;

  for (const r of results) {
    if (r.status === RESOURCE_STATUS.MATCH) continue;
    if (
      r.status === RESOURCE_STATUS.MISSING_LIVE ||
      r.status === RESOURCE_STATUS.MISSING_HELM
    ) {
      exitCode = Math.max(exitCode, 2);
    }

    console.log(chalk.bold(formatResourceIdentifier(r.resource)), chalk.yellow(r.status));

    for (const d of r.differences) {
      const marker = d.action === DIFF_ACTION.FAIL ? FAIL_MARK : WARN_MARK;
      console.log(" ", marker, formatDiffPath(d.path));
      if (d.action === DIFF_ACTION.FAIL) exitCode = 2;
      if (d.action === DIFF_ACTION.WARN && exitCode === 0) exitCode = 1;
    }
  }

  if (exitCode === 0) {
    console.log(chalk.green("All resources match"));
  }

  return exitCode;
};

const formatResourceIdentifier = (resource: ResourceIdentifier): string => {
  return `${resource.kind}/${resource.namespace}/${resource.name}`;
};

const formatDiffPath = (path: DiffPath): string => {
  if (!path || path.length === 0) return "";

  return path
    .map(segment => {
      if (segment.type === "index") {
        return `[${segment.index}]`;
      }
      return segment.name;
    })
    .reduce((acc, part) => {
      if (part.startsWith("[")) return `${acc}${part}`;
      return acc ? `${acc}.${part}` : part;
    }, "");
};
