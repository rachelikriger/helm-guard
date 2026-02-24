export const MODE = {
    BOOTSTRAP: 'bootstrap',
    HELM_MANAGED: 'helm-managed',
} as const;

export type Mode = (typeof MODE)[keyof typeof MODE];

export type K8sKind = string;

export type DiffPath = string;
