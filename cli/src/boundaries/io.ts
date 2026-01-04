import { execFileSync } from "child_process";
import { parseAllDocuments } from "yaml";

export const execWithContext = (
  command: string,
  args: string[],
  context: string
): string => {
  try {
    return execFileSync(command, args, { encoding: "utf-8" });
  } catch (err) {
    throw new Error(`Failed to ${context}: ${formatError(err)}`);
  }
};

export const parseYamlDocuments = (
  yaml: string,
  context: string
): unknown[] => {
  try {
    return parseAllDocuments(yaml)
      .map(doc => doc.toJS())
      .filter(Boolean);
  } catch (err) {
    throw new Error(`Failed to parse ${context}: ${formatError(err)}`);
  }
};

export const formatError = (err: unknown): string => {
  if (err instanceof Error) {
    const stderr = getErrorOutput(err);
    return stderr ? `${err.message}: ${stderr}` : err.message;
  }
  return String(err);
};

const getErrorOutput = (err: Error): string | undefined => {
  const errorWithOutput = err as Error & { stderr?: unknown };
  if (!errorWithOutput.stderr) {
    return undefined;
  }
  if (typeof errorWithOutput.stderr === "string") {
    return errorWithOutput.stderr.trim();
  }
  if (errorWithOutput.stderr instanceof Buffer) {
    return errorWithOutput.stderr.toString("utf-8").trim();
  }
  return String(errorWithOutput.stderr).trim();
};
