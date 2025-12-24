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
    return err.message;
  }
  return String(err);
};
