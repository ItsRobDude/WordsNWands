# Words 'n Wands! Development Setup and Dependency Troubleshooting

This document defines the canonical local setup path for contributors and the expected recovery steps when dependency installation or workspace commands behave unexpectedly.

Its purpose is to prevent repeated setup confusion and keep local contributor behavior aligned with the repo's actual `pnpm` workspace contract.

---

## 1. Baseline Setup

Use:

- Node.js 24.x
- `pnpm` 10.x

Install from repo root:

```bash
pnpm install --frozen-lockfile
```

After install, verify the basic toolchain:

```bash
pnpm exec prettier --version
pnpm exec tsc -v
pnpm typecheck
```

Practical rule:

- dependency declarations in `package.json` and `pnpm-lock.yaml` are the source of truth for what the repo needs
- those declarations are **not** auto-installed merely by cloning the repo
- every contributor still needs to run `pnpm install --frozen-lockfile` locally

---

## 2. Canonical Validation Commands

Run from repo root:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

The root workspace scripts intentionally execute workspaces with serial recursion (`--workspace-concurrency=1`).

Reason:

- this repo uses the serial mode to avoid the Windows `spawn EPERM` failure seen with pnpm's default parallel recursive runner on some machines

Contributors should treat the root scripts as canonical and should not replace them with ad hoc parallel recursive commands in docs or automation without re-validating Windows behavior.

---

## 3. What a Healthy Install Looks Like

After a successful install, the repo should have:

- `node_modules/.bin`
- linked root tools such as `node_modules/prettier`, `node_modules/typescript`, and `node_modules/vitest`
- package-local links such as `apps/mobile/node_modules/expo`

If `pnpm exec prettier --version` or `pnpm exec tsc -v` fails, assume the install is incomplete or corrupted even if `pnpm-lock.yaml` is present.

---

## 4. Common Failure Modes

### 4.1 Dependencies are listed but commands still say package not found

Likely cause:

- the install did not finish cleanly, or `node_modules` is only partially linked

Typical symptoms:

- `pnpm exec prettier --version` fails
- `pnpm exec tsc -v` fails
- root `node_modules` has `.pnpm` content but is missing `.bin` or package links

Recovery:

```bash
pnpm install --frozen-lockfile
```

If the workspace is still inconsistent, perform a clean reinstall:

```bash
rm -rf node_modules .pnpm-store
pnpm install --frozen-lockfile
```

Windows PowerShell equivalent:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .pnpm-store -ErrorAction SilentlyContinue
pnpm install --frozen-lockfile
```

### 4.2 `ERR_PNPM_NO_OFFLINE_TARBALL` or offline install behavior you did not expect

Likely cause:

- a shell or machine-level config is forcing offline mode

Check for:

- `NPM_CONFIG_OFFLINE=true`
- pnpm config reporting `offline=true`

Recovery:

```powershell
Remove-Item Env:NPM_CONFIG_OFFLINE -ErrorAction SilentlyContinue
pnpm config list
```

Expected result:

- `offline=false`

### 4.3 npm registry requests try to go through `127.0.0.1:9` or fail with `ECONNREFUSED`

Likely cause:

- stale proxy environment variables are hijacking npm/pnpm traffic

Check for:

- `HTTP_PROXY`
- `HTTPS_PROXY`
- `ALL_PROXY`

Recovery in PowerShell:

```powershell
Remove-Item Env:HTTP_PROXY,Env:HTTPS_PROXY,Env:ALL_PROXY -ErrorAction SilentlyContinue
```

If the proxy variables are coming from user-level environment settings, clear them there too:

```powershell
[Environment]::SetEnvironmentVariable('HTTP_PROXY', $null, 'User')
[Environment]::SetEnvironmentVariable('HTTPS_PROXY', $null, 'User')
[Environment]::SetEnvironmentVariable('ALL_PROXY', $null, 'User')
```

### 4.4 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`

Likely cause:

- `pnpm install` wants to purge/rebuild modules but the current shell session is non-interactive

Recovery:

```powershell
$env:CI='true'
pnpm install --frozen-lockfile
```

### 4.5 `Ignored build scripts: esbuild@...`

Likely cause:

- pnpm 10 build-script approval protection

Meaning:

- install completed, but pnpm did not allow that dependency's postinstall/build script yet

Recovery path:

- if later build or bundling commands fail because `esbuild` was not approved, run:

```bash
pnpm approve-builds
```

- approve `esbuild`

Do not approve arbitrary packages casually; only approve the packages the repo actually needs.

---

## 5. Contributor Expectations

When setup is broken, do not assume:

- the lockfile is wrong
- the dependency declarations are missing
- TypeScript errors are dependency failures

Check in this order:

1. `pnpm config list`
2. shell env overrides for offline/proxy behavior
3. `pnpm exec prettier --version`
4. `pnpm exec tsc -v`
5. `pnpm install --frozen-lockfile`
6. `pnpm typecheck`

Practical rule:

- separate **install health** from **repo code health**
- if `pnpm exec` commands fail, fix install health first
- if `pnpm exec` commands work but `pnpm typecheck` fails, the remaining issue is probably normal code validation rather than dependency setup

---

## 6. When Updating Dependencies

When intentionally changing dependencies:

1. update the relevant `package.json`
2. regenerate and commit `pnpm-lock.yaml`
3. confirm `pnpm install --frozen-lockfile` works from a clean state
4. run the canonical validation commands required by the touched scope
5. update this document or `README.md` if the contributor setup path changed

Do not land dependency changes that only work on one contributor machine through hidden env overrides.
