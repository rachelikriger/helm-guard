import type { NormalizationRule } from "./report-contract";

export const NORMALIZATION_RULES: ReadonlyArray<NormalizationRule> = [
  {
    id: "podSpec.dnsPolicy",
    target: "PodSpec",
    field: "dnsPolicy",
    defaultValue: "ClusterFirst",
    description: "Pod DNS policy defaults to ClusterFirst.",
    rationale: "Kubernetes sets this when unspecified; it does not indicate user intent."
  },
  {
    id: "container.terminationMessagePath",
    target: "Container",
    field: "terminationMessagePath",
    defaultValue: "/dev/termination-log",
    description: "Container termination message path defaults to /dev/termination-log.",
    rationale: "Platform default with no behavioral difference when omitted."
  },
  {
    id: "container.terminationMessagePolicy",
    target: "Container",
    field: "terminationMessagePolicy",
    defaultValue: "File",
    description: "Container termination message policy defaults to File.",
    rationale: "System-provided default that does not represent explicit user choice."
  },
  {
    id: "service.spec.type",
    target: "ServiceSpec",
    field: "type",
    defaultValue: "ClusterIP",
    description: "Service type defaults to ClusterIP.",
    rationale: "Service type is ClusterIP when not specified by the user."
  },
  {
    id: "service.port.protocol",
    target: "ServicePort",
    field: "protocol",
    defaultValue: "TCP",
    description: "Service port protocol defaults to TCP.",
    rationale: "Kubernetes assigns TCP when protocol is omitted."
  },
  {
    id: "container.imagePullPolicy.always",
    target: "Container",
    field: "imagePullPolicy",
    defaultValue: "Always",
    description: "imagePullPolicy defaults to Always when omitted.",
    rationale: "Kubernetes assigns Always when not set; explicit values still surface."
  }
];
