import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const webRepo = process.env.OUTLIN_WEB_REPO ?? join(root, "..", "outlin-web");

if (!existsSync(join(webRepo, "package.json"))) {
  console.error(`outlin-web checkout not found at ${webRepo}`);
  console.error("Set OUTLIN_WEB_REPO to point at the outlin-web repo.");
  process.exit(1);
}

const sync = (from, to) =>
  execSync(`rsync -a --delete --exclude node_modules --exclude .next --exclude out ${from}/ ${to}/`, {
    stdio: "inherit",
  });

console.log("→ syncing apps/web");
sync(join(root, "apps/web"), join(webRepo, "apps/web"));

console.log("→ syncing packages/editor");
sync(join(root, "packages/editor"), join(webRepo, "packages/editor"));

console.log("→ syncing CI workflow");
execSync(`mkdir -p ${join(webRepo, ".github/workflows")}`, { stdio: "inherit" });
execSync(
  `cp ${join(root, "scripts/installers/build-installers.yml")} ${join(webRepo, ".github/workflows/build-installers.yml")}`,
  { stdio: "inherit" },
);

console.log("→ syncing workspace root files");
for (const f of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"]) {
  execSync(`cp ${join(root, f)} ${join(webRepo, f)}`, { stdio: "inherit" });
}

console.log("→ committing & pushing");
execSync(
  `git -C ${webRepo} add -A && git -C ${webRepo} commit -m "Sync from monorepo" --allow-empty && git -C ${webRepo} pull --rebase origin main && git -C ${webRepo} push origin main`,
  { stdio: "inherit" },
);

console.log("✓ outlin-web updated");
