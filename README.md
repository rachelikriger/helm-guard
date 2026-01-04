````md
# 🛡️ helm-guard

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
- Fetches live, namespace-scoped resources from OpenShift
- Normalizes noisy/system fields
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
- **Optional JSON report** (for CI artifacts & UI visualization)

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
  --output report.json
````

> ⚠️ **Important**
> helm-guard is only as accurate as the Helm context you provide.
> Always pass the same `--release` and `--values` used in deployment.

---

### CLI Options

| Option        | Description                                  |
| ------------- | -------------------------------------------- |
| `--chart`     | Path to Helm chart                           |
| `--namespace` | Target OpenShift namespace                   |
| `--release`   | Helm release name                            |
| `--values`    | Helm values file (repeatable, order matters) |
| `--strict`    | Treat all diffs as blocking                  |
| `--output`    | Write JSON report to file                    |

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

* Does not run Helm
* Does not connect to OpenShift
* Visualizes validation results only

You can load a report via URL:

```
https://helm-guard-ui/?reportUrl=<artifact-url>
```

---

## Container Usage

helm-guard is packaged as two images:

* **CLI image** – runs the validation logic
* **UI image** – serves the report viewer

CI and production environments run the CLI image directly.
Dockerfiles are provided for OpenShift deployment.

---

## Repository Structure

```
helm-guard/
├── cli/        # Validation engine (CLI)
├── shared/     # JSON report contract
├── ui/         # Report viewer (static UI)
└── README.md
```

---

## Summary

helm-guard is a **guardrail**, not a deployment tool.

If it passes — you can deploy with confidence.
If it fails — it tells you exactly why.

```
