import fs from "fs";
import { MODE, Mode } from "../domain/types";

export const validateInputs = (
  chart: string,
  namespace: string,
  mode?: Mode | string
): Mode => {
  if (!chart || !fs.existsSync(chart)) {
    throw new Error(`Invalid CLI input: Chart path does not exist: ${chart}`);
  }

  if (!namespace || !namespace.trim()) {
    throw new Error("Invalid CLI input: Namespace is required and cannot be empty");
  }

  const modeValue = mode ?? MODE.BOOTSTRAP;

  if (modeValue === MODE.BOOTSTRAP || modeValue === MODE.HELM_MANAGED) {
    return modeValue;
  }

  throw new Error(
    `Invalid CLI input: Mode must be either "${MODE.BOOTSTRAP}" or "${MODE.HELM_MANAGED}"`
  );
};
