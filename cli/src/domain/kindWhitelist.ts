import { K8sKind, K8sResource } from "./types";

export const deriveKindWhitelist = (resources: K8sResource[]): K8sKind[] => {
  const kinds = new Set<K8sKind>();

  for (const resource of resources) {
    const kind = resource.kind.trim();
    if (kind) {
      kinds.add(kind);
    }
  }

  return Array.from(kinds).sort((a, b) => a.localeCompare(b));
};
