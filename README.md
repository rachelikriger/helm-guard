# helm-guard

**helm-guard** compares **Helm-rendered manifests** against **live OpenShift resources** before deployment. It detects configuration drift and validates Helm changes without modifying the cluster.

- Renders with `helm template`, fetches live resources for rendered kinds only, normalizes platform defaults, and produces a semantic diff.
- Use as a pre-deployment gate: before `helm upgrade`, in CI, or when validating environment-specific values.

---

## Output

- **Console summary** (human-readable)
- **JSON report** (optional, for CI artifacts and UI)

| Exit | Meaning |
| ---- | ------- |
| 0 | No differences |
| 1 | Warnings only |
| 2 | Blocking differences |
| 3 | Runtime/usage error |

---

## CLI

**Requirements:** Node.js 18+, Helm, OpenShift auth (`oc login` / `KUBECONFIG`)

```bash
node dist/index.js \
  --chart ./path/to/chart \
  --namespace my-namespace \
  --release my-release \
  --values values.yaml \
  --set image.tag=1.2.3 \
  --output report.json
```

> Pass the same `--release`, `--values`, and `--set` inputs used in deployment.

| Option | Description |
| ------ | ----------- |
| `--chart` | Path to Helm chart |
| `--namespace` | Target OpenShift namespace |
| `--mode` | `bootstrap` (only mode) |
| `--release` | Helm release name |
| `--values` | Values file (repeatable) |
| `--set` | Set value (repeatable, key=value) |
| `--strict` | Treat all diffs as blocking |
| `--output` | Write JSON report |

---

## CI

1. Run helm-guard in a container
2. Save `report.json` as artifact
3. Review via UI

helm-guard does not deploy or authenticate to the cluster; CI handles that.

---

## UI

Static report viewer. Load via URL:

```
https://helm-guard-ui/?reportUrl=<artifact-url>
```

**GitLab private artifacts:** set `GITLAB_PROXY_TOKEN` (Project/Group token, `read_api` scope). For deployment:

```yaml
env:
  - name: GITLAB_PROXY_TOKEN
    valueFrom:
      secretKeyRef:
        name: helm-guard-gitlab-token
        key: token
```

For local dev: `.env.local` with `GITLAB_PROXY_TOKEN` (see `ui/.env.local.example`). Self-hosted GitLab with self-signed cert: set `NODE_TLS_REJECT_UNAUTHORIZED=0` (dev/test only).

---

## Containers

Two images: **CLI** (validation) and **UI** (report viewer). Dockerfiles for OpenShift.

---

## Structure

```
helm-guard/
- cli/     # Validation engine
- shared/  # Report contract
- ui/      # Report viewer
```

Build `shared` before `cli` and `ui`.
