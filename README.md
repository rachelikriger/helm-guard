# helm-guard

**helm-guard** is a guardrail tool for Helm adoption on OpenShift.

It validates that the manifests produced by `helm template` match the live resources
currently deployed in an OpenShift cluster **before** any real `helm upgrade` is executed.

This project includes:
- `cli/` — a TypeScript Node.js CLI that performs the comparison.
- `ui/` — a React (Vite) web viewer that visualizes a saved JSON report (read-only).

> ⚠️ Important: helm-guard does **not** deploy anything.  
> It only compares and reports.

## Repository Structure

## How It Works (End-to-End Flow)

1. **Render Helm output**

   * The CLI runs `helm template`.
   * Helm output is usually a **multi-document YAML** stream (`---` between resources).
   * The CLI parses it into an array of resources (`K8sResource[]`).

2. **Fetch live OpenShift resources**

   * The CLI runs `oc get ... -o yaml` (namespace-scoped).
   * It parses the response into `K8sResource[]`.

3. **Normalize**

   * Removes OpenShift/Kubernetes system-generated fields (e.g. uid, resourceVersion, status).
   * Sorts arrays (when possible) for deterministic comparisons.

4. **Compare**

   * Matches resources by: `<Kind>/<namespace>/<name>`
   * Produces one result per resource:

     * `MATCH`
     * `DRIFT`
     * `MISSING_LIVE`
     * `MISSING_HELM`
   * Each detected diff is classified as:

     * `WARN`
     * `FAIL`
     * (and ignored diffs are filtered out)

5. **Report**

   * Prints a readable summary to the console.
   * Returns an exit code (CI friendly).
   * Optionally, results can be wrapped into a JSON report for the UI viewer.

## CLI (cli/)

### Install & Run

```bash
cd cli
npm install
npm run build
node dist/index.js --chart ./path/to/chart --namespace prod
```

### Options

* `--chart <path>`: path to your Helm chart directory
* `--namespace <ns>`: namespace to compare against
* `--strict`: strict mode (treat diffs as failures)

### Exit Codes

* `0` — all resources matched (no diffs)
* `1` — warnings found (drift exists but not considered a failure)
* `2` — failures found OR missing resources
* `3` — runtime error

### About Helm Output Size

Helm charts may produce hundreds of YAML resources.
This is supported because `helm template` output is parsed into an in-memory list of resources.
The comparison is done **per resource**, not per file.


## UI Viewer (ui/)

The UI is a **read-only report viewer**.
It does not connect to OpenShift and does not run Helm.

### Run the UI locally

```bash
cd ui
npm install
npm run dev
```

Then upload a report JSON file (for example: `sample-report.json`).

## Report Format (Consumed by UI)

The UI expects a JSON report with this structure:

```json
{
  "timestamp": "ISO",
  "config": { "helmChart": "...", "namespace": "...", "strictMode": false },
  "summary": {
    "total": 0,
    "matched": 0,
    "drifted": 0,
    "missingLive": 0,
    "missingHelm": 0,
    "warnings": 0,
    "failures": 0
  },
  "results": [
    {
      "resourceKey": "Kind/ns/name",
      "status": "MATCH|DRIFT|MISSING_LIVE|MISSING_HELM",
      "differences": [
        { "path": "...", "helmValue": {}, "liveValue": {}, "action": "WARN|FAIL" }
      ]
    }
  ]
}
```

## Notes

* The tool is designed to be used:
  1. manually (local developer machine)
  2. as a CI stage before deployment

* It is intentionally minimal:
  1. no backend server
  2. no database
  3. no approvals
  3. no deployment logic
