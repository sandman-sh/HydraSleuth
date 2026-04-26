import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WORKSPACE_MARKERS = ["package.json", "apps", "packages", "programs"];

function isWorkspaceRoot(candidate: string) {
  return WORKSPACE_MARKERS.every((marker) => existsSync(resolve(candidate, marker)));
}

function* walkParents(start: string) {
  const visited = new Set<string>();
  let current = resolve(start);

  while (!visited.has(current)) {
    visited.add(current);
    yield current;
    const parent = dirname(current);

    if (parent === current) {
      break;
    }

    current = parent;
  }
}

function* candidateRoots() {
  const moduleDirectory = dirname(fileURLToPath(import.meta.url));
  yield process.cwd();
  yield moduleDirectory;
  yield resolve(moduleDirectory, "..");
  yield resolve(moduleDirectory, "..", "..");
  yield resolve(moduleDirectory, "..", "..", "..");
}

export function findWorkspaceRoot() {
  for (const start of candidateRoots()) {
    for (const candidate of walkParents(start)) {
      if (isWorkspaceRoot(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error(
    "HydraSleuth could not locate the workspace root. Run the app from the project tree or restore the monorepo layout.",
  );
}

export function resolveWorkspacePath(...segments: string[]) {
  return resolve(findWorkspaceRoot(), ...segments);
}

export function resolveMaybeWorkspaceRelative(pathname: string) {
  return isAbsolute(pathname) ? pathname : resolveWorkspacePath(pathname);
}
