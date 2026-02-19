# helm-guard

**helm-guard** is a lightweight validation tool that compares
**Helm-rendered manifests** against **live OpenShift resources**
*before deployment*.

It helps teams detect configuration drift and validate Helm changes
safely, deterministically, and without modifying the cluster.

---

## What does helm-guard do?

helm-guard validates that what **Helm would deploy**
matches what is **currently running** in a given namespace.

It:

- Renders manifests using `helm template`
- Derives a whitelist of kinds from the rendered Helm output
- Fetches live, namespace-scoped resources from OpenShift **only for those kinds**
- Normalizes noisy/system fields and safe, path-specific platform defaults
- Performs a **semantic comparison** (not a raw YAML diff)
- Produces a clear validation result for CI and humans

---

## When should I use it?

Use helm-guard as a **pre-deployment gate**:

- Before running `helm upgrade`
- During first-time Helm adoption
- In CI pipelines to prevent unsafe changes
- When validating environment-specific values (`-f` files, release names)

---

## What does it output?

helm-guard produces:

- **Console summary** (human-readable)
- **Optional JSON report** (for CI artifacts and UI visualization)

Exit codes are CI-friendly:

| Code | Meaning |
| ---- | ------- |
| 0    | No differences |
| 1    | Warnings only |
| 2    | Blocking differences detected |
| 3    | Runtime or usage error |

---

## CLI Usage

### Requirements

- Node.js **18+**
- Helm and OpenShift authentication already configured
  (`oc login` / `KUBECONFIG`)

---

### Run locally

```bash
node dist/index.js \
  --chart ./path/to/chart \
  --namespace my-namespace \
  --release my-release \
  --values values.yaml \
  --values values.prod.yaml \
  --set image.tag=1.2.3 \
  --output report.json
```

> **Important**
> helm-guard is only as accurate as the Helm context you provide.
> Always pass the same `--release`, `--values`, and `--set` inputs used in deployment.

---

### CLI Options

| Option        | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `--chart`     | Path to Helm chart                                                 |
| `--namespace` | Target OpenShift namespace                                         |
| `--mode`      | Comparison mode (`bootstrap` only; `helm-managed` not implemented) |
| `--release`   | Helm release name                                                  |
| `--values`    | Helm values file (repeatable, order matters)                       |
| `--set`       | Helm set value (repeatable, key=value)                             |
| `--strict`    | Treat all diffs as blocking                                        |
| `--output`    | Write JSON report to file                                          |

---


## CI Integration

Typical CI flow:

1. Run `helm-guard` inside a container
2. Save `report.json` as an artifact
3. Review results via the UI

helm-guard **does not** deploy anything and **does not** authenticate to the cluster.
Those concerns are handled by the CI environment.

---

## UI

The UI is a **static viewer** for helm-guard reports.

It:

- Does not run Helm
- Does not connect to OpenShift
- Visualizes validation results only
- Offers a name-based filter that recalculates summary counts and the resource list

You can load a report via URL:

```
https://helm-guard-ui/?reportUrl=<artifact-url>
```

For **GitLab CI artifacts** (private projects): set `GITLAB_PROXY_TOKEN` env var when deploying the UI (e.g. OpenShift Secret). Use a Project/Group Access Token with `read_api` scope. The token is never sent in URLs.

---

## Container Usage

helm-guard is packaged as two images:

- **CLI image** - runs the validation logic
- **UI image** - serves the report viewer

CI and production environments run the CLI image directly.
Dockerfiles are provided for OpenShift deployment.

### UI deployment (GitLab proxy token)

When deploying the UI for GitLab artifact viewing, set the env var:

```yaml
env:
  - name: GITLAB_PROXY_TOKEN
    valueFrom:
      secretKeyRef:
        name: helm-guard-gitlab-token
        key: token
```

Use a Project or Group Access Token with `read_api` scope. The token is injected at container startup and never appears in URLs.

---

## Report Flow (Exact)

1. Render the Helm chart using the provided inputs.
2. Derive the unique kind whitelist from the rendered output.
3. Fetch live OpenShift resources **only** for the whitelisted kinds in the namespace.
4. Apply platform default normalization before diffing:
   - Only path-specific, explicitly documented defaults are normalized.
5. Build `report.json` from the Helm output, whitelisted live resources, and normalized diffs.

## Normalization (mental model)

Normalization runs in three phases, in order:

1. Resource cleanup (technical normalization) in `cli/src/domain/normalization/resourceNormalizer.ts`
2. Diff gating (single decision point) in `cli/src/domain/normalization/shouldIncludeDiff.ts`
3. Platform default rules (knowledge base) in `cli/src/domain/normalization/platformDefaultRules.ts`

To add a new default suppression, append a rule to `cli/src/domain/normalization/platformDefaultRules.ts`.
All normalization lives under `cli/src/domain/normalization`; `shared` contains contracts only and the UI only renders reports. Out of scope: Helm-managed comparison mode and any UI-side normalization or decision logic.

---

## Reliability and Failure Behavior

- Any failure to run Helm or OpenShift commands is treated as a hard error.
- `oc` failures (auth, network, API errors) stop the run with a non-zero exit code.
- The tool never converts operational failures into empty or partial results.
- Helm resources without `metadata.namespace` are treated as belonging to the target namespace.
- Live resources are always filtered to the target namespace only.

## Report Contract

- `report.json` includes `schemaVersion: 1` and is considered stable within major releases.
- `timestamp` is informational only and should be ignored for deterministic comparisons.

---

## Repository Structure

```
helm-guard/
- cli/        # Validation engine (CLI)
- shared/     # JSON report contract
- ui/         # Report viewer (static UI)
- README.md
```

`@helm-guard/shared` is an internal package consumed via `node_modules` only.
Build `shared` before `cli` and `ui` (or let its `prepare` script build it).

---

## Summary

helm-guard is a **guardrail**, not a deployment tool.

If it passes - you can deploy with confidence.
If it fails - it tells you exactly why.


