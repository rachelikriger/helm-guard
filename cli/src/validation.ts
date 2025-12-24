import { K8sResource } from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isK8sResource(val: unknown): val is K8sResource {
  if (!isRecord(val)) return false;
  if (typeof val.apiVersion !== "string") return false;
  if (typeof val.kind !== "string") return false;

  const meta = val.metadata;
  if (!isRecord(meta)) return false;
  if (typeof meta.name !== "string") return false;

  return true;
}
