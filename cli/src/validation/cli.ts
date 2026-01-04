import fs from "fs";
import { HelmRenderOptions, MODE, Mode } from "../domain/types";

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

export const validateHelmRenderOptions = (
  releaseName?: string,
  valuesFiles?: string[]
): HelmRenderOptions => {
  const options: HelmRenderOptions = {};

  if (releaseName !== undefined) {
    if (!releaseName.trim()) {
      throw new Error("Invalid CLI input: Release name must be a non-empty string");
    }
    options.releaseName = releaseName;
  }

  if (valuesFiles && valuesFiles.length > 0) {
    for (const valuesFile of valuesFiles) {
      if (!fs.existsSync(valuesFile)) {
        throw new Error(`Invalid CLI input: Values file does not exist: ${valuesFile}`);
      }
    }
    options.valuesFiles = valuesFiles;
  }

  return options;
};
