export type ResourceScope = "cluster" | "namespaced" | "unknown";

const CLUSTER_SCOPED_KINDS = [
  "Namespace",
  "Node",
  "PersistentVolume",
  "StorageClass",
  "VolumeAttachment",
  "CSIDriver",
  "CSINode",
  "ClusterRole",
  "ClusterRoleBinding",
  "CustomResourceDefinition",
  "APIService",
  "MutatingWebhookConfiguration",
  "ValidatingWebhookConfiguration",
  "PodSecurityPolicy",
  "PriorityClass",
  "RuntimeClass",
  "CertificateSigningRequest",
  "IngressClass",
  "GatewayClass",
  "ClusterIssuer",
  "ClusterPolicy",
  "SecurityContextConstraints",
  "ClusterResourceQuota",
  "Project",
  "ClusterOperator",
  "ClusterVersion",
  "ClusterNetwork",
  "OAuthClient",
  "OAuthClientAuthorization",
  "OAuthAccessToken",
  "OAuthAuthorizeToken",
];

const CLUSTER_SCOPED_KIND_SET = new Set(
  CLUSTER_SCOPED_KINDS.map(kind => kind.toLowerCase())
);

export const isClusterScopedKind = (kind: string): boolean => {
  return CLUSTER_SCOPED_KIND_SET.has(kind.trim().toLowerCase());
};

export interface ResourceKeyDetails {
  kind: string;
  name: string;
  namespace?: string;
  scope: ResourceScope;
  legacyKey: boolean;
  inferredNamespace: boolean;
}

export const classifyResourceKey = (
  resourceKey: string,
  defaultNamespace?: string
): ResourceKeyDetails => {
  const trimmedKey = resourceKey.trim();
  const clusterSplit = trimmedKey.split("::cluster/");
  if (clusterSplit.length === 2) {
    return {
      kind: clusterSplit[0].trim(),
      name: clusterSplit[1].trim(),
      scope: "cluster",
      legacyKey: false,
      inferredNamespace: false,
    };
  }

  const parts = trimmedKey.split("/");
  if (parts.length === 3) {
    return {
      kind: parts[0].trim(),
      namespace: parts[1].trim(),
      name: parts[2].trim(),
      scope: "namespaced",
      legacyKey: false,
      inferredNamespace: false,
    };
  }

  if (parts.length === 2) {
    const kind = parts[0].trim();
    const name = parts[1].trim();
    if (isClusterScopedKind(kind)) {
      return {
        kind,
        name,
        scope: "cluster",
        legacyKey: true,
        inferredNamespace: false,
      };
    }

    const fallbackNamespace = defaultNamespace?.trim();
    if (fallbackNamespace) {
      return {
        kind,
        name,
        namespace: fallbackNamespace,
        scope: "namespaced",
        legacyKey: true,
        inferredNamespace: true,
      };
    }

    return {
      kind,
      name,
      scope: "unknown",
      legacyKey: true,
      inferredNamespace: false,
    };
  }

  return {
    kind: "",
    name: trimmedKey,
    scope: "unknown",
    legacyKey: true,
    inferredNamespace: false,
  };
};
