import type { NormalizationRuleId } from "../../../shared/report-contract";
import type { K8sResource } from "./types";
import type { NormalizationTracker } from "./platformDefaultRules";

type RecordMap = Record<string, unknown>;

export const applyPlatformDefaults = (
  helm: K8sResource,
  live: K8sResource,
  tracker: NormalizationTracker
): { helm: K8sResource; live: K8sResource } => {
  const helmClone = structuredClone(helm);
  const liveClone = structuredClone(live);

  normalizePodSpecDefaults(helmClone, liveClone, tracker);
  normalizeServiceDefaults(helmClone, liveClone, tracker);

  return { helm: helmClone, live: liveClone };
};

const normalizePodSpecDefaults = (
  helm: K8sResource,
  live: K8sResource,
  tracker: NormalizationTracker
): void => {
  const helmPodSpec = getPodSpec(helm);
  const livePodSpec = getPodSpec(live);
  if (!helmPodSpec || !livePodSpec) return;

  removeDefaultField(
    helmPodSpec,
    livePodSpec,
    "dnsPolicy",
    "ClusterFirst",
    "podSpec.dnsPolicy",
    tracker
  );

  normalizeContainerDefaults(
    getContainersByName(helmPodSpec.containers),
    getContainersByName(livePodSpec.containers),
    tracker
  );

  normalizeContainerDefaults(
    getContainersByName(helmPodSpec.initContainers),
    getContainersByName(livePodSpec.initContainers),
    tracker
  );
};

const normalizeContainerDefaults = (
  helmContainers: Map<string, RecordMap>,
  liveContainers: Map<string, RecordMap>,
  tracker: NormalizationTracker
): void => {
  for (const [name, liveContainer] of liveContainers.entries()) {
    const helmContainer = helmContainers.get(name);
    if (!helmContainer) continue;

    removeDefaultField(
      helmContainer,
      liveContainer,
      "terminationMessagePath",
      "/dev/termination-log",
      "container.terminationMessagePath",
      tracker
    );

    removeDefaultField(
      helmContainer,
      liveContainer,
      "terminationMessagePolicy",
      "File",
      "container.terminationMessagePolicy",
      tracker
    );

    removeDefaultField(
      helmContainer,
      liveContainer,
      "imagePullPolicy",
      "Always",
      "container.imagePullPolicy.always",
      tracker
    );
  }
};

const normalizeServiceDefaults = (
  helm: K8sResource,
  live: K8sResource,
  tracker: NormalizationTracker
): void => {
  if (helm.kind !== "Service" || live.kind !== "Service") return;

  const helmSpec = asRecord(helm.spec);
  const liveSpec = asRecord(live.spec);
  if (!helmSpec || !liveSpec) return;

  removeDefaultField(
    helmSpec,
    liveSpec,
    "type",
    "ClusterIP",
    "service.spec.type",
    tracker
  );

  const helmPorts = getPortsByKey(helmSpec.ports);
  const livePorts = getPortsByKey(liveSpec.ports);

  for (const [key, livePort] of livePorts.entries()) {
    const helmPort = helmPorts.get(key);
    if (!helmPort) continue;

    removeDefaultField(
      helmPort,
      livePort,
      "protocol",
      "TCP",
      "service.port.protocol",
      tracker
    );
  }
};

const removeDefaultField = (
  helm: RecordMap,
  live: RecordMap,
  field: string,
  defaultValue: unknown,
  ruleId: NormalizationRuleId,
  tracker: NormalizationTracker
): void => {
  if (helm[field] !== undefined) return;
  if (live[field] !== defaultValue) return;
  delete live[field];
  tracker.increment(ruleId);
};

const getPodSpec = (resource: K8sResource): RecordMap | undefined => {
  const spec = asRecord(resource.spec);
  if (!spec) return undefined;

  if (resource.kind === "Pod") return spec;

  if (resource.kind === "CronJob") {
    const jobTemplate = asRecord(spec.jobTemplate);
    const jobSpec = jobTemplate ? asRecord(jobTemplate.spec) : undefined;
    const template = jobSpec ? asRecord(jobSpec.template) : undefined;
    return template ? asRecord(template.spec) : undefined;
  }

  const template = asRecord(spec.template);
  return template ? asRecord(template.spec) : undefined;
};

const getContainersByName = (
  containers: unknown
): Map<string, RecordMap> => {
  const entries = new Map<string, RecordMap>();
  if (!Array.isArray(containers)) return entries;

  for (const container of containers) {
    const record = asRecord(container);
    if (!record) continue;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) continue;
    entries.set(name, record);
  }

  return entries;
};

const getPortsByKey = (ports: unknown): Map<string, RecordMap> => {
  const entries = new Map<string, RecordMap>();
  if (!Array.isArray(ports)) return entries;

  for (const port of ports) {
    const record = asRecord(port);
    if (!record) continue;
    const key = getPortKey(record);
    if (!key) continue;
    entries.set(key, record);
  }

  return entries;
};

const getPortKey = (port: RecordMap): string | undefined => {
  if (typeof port.name === "string" && port.name.trim()) {
    return `name:${port.name.trim()}`;
  }
  if (typeof port.port === "number" || typeof port.port === "string") {
    return `port:${String(port.port)}`;
  }
  return undefined;
};

const asRecord = (value: unknown): RecordMap | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  return value as RecordMap;
};
