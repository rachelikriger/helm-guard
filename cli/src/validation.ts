import { K8sResource } from "./types";

export function isK8sResource(val: unknown): val is K8sResource {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  if (typeof obj.apiVersion !== "string") return false;
  if (typeof obj.kind !== "string") return false;
  const meta = obj.metadata;
  if (typeof meta !== "object" || meta === null) return false;
  if (typeof (meta as Record<string, unknown>).name !== "string") return false;
  return true;
}
