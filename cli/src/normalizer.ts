import { K8sResource } from "./types";

const IGNORED_METADATA_FIELDS = [
  "uid",
  "resourceVersion",
  "creationTimestamp",
  "generation",
  "managedFields"
];

export function normalize(resource: K8sResource): K8sResource {
  const clone = structuredClone(resource);

  delete clone.status;

  for (const field of IGNORED_METADATA_FIELDS) {
    delete clone.metadata[field];
  }

  if (clone.metadata.annotations) {
    for (const key of Object.keys(clone.metadata.annotations)) {
      if (key.startsWith("openshift.io")) {
        delete clone.metadata.annotations[key];
      }
    }
  }

  normalizeArrays(clone);
  return clone;
}

function normalizeArrays(obj: unknown): void {
  if (Array.isArray(obj)) {
    if (isSortableByName(obj)) {
      obj.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }
    obj.forEach(normalizeArrays);
  } else if (typeof obj === "object" && obj !== null) {
    Object.values(obj).forEach(normalizeArrays);
  }
}

function isSortableByName(arr: unknown[]): arr is Array<{ name: unknown }> {
  return arr.every(isObjectWithName);
}

function isObjectWithName(value: unknown): value is { name: unknown } {
  return typeof value === "object" && value !== null && "name" in value;
}
