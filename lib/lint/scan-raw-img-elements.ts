import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAW_IMG_PATTERN = /<img[\s/>]/;

const SOURCE_ROOTS = ["app", "components", "lib"] as const;

const IGNORED_SUFFIXES = [".test.ts", ".test.tsx"] as const;

const ALLOWED_RELATIVE_FILES = new Set([
  "components/media/app-image.tsx",
]);

function shouldScanFile(relativePath: string): boolean {
  if (!relativePath.endsWith(".tsx")) return false;
  if (ALLOWED_RELATIVE_FILES.has(relativePath)) return false;
  if (IGNORED_SUFFIXES.some((suffix) => relativePath.endsWith(suffix))) {
    return false;
  }
  return true;
}

function walkDirectory(
  rootDir: string,
  currentDir: string,
  files: string[],
): void {
  for (const entry of readdirSync(currentDir)) {
    const absolutePath = join(currentDir, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      walkDirectory(rootDir, absolutePath, files);
      continue;
    }
    if (!stats.isFile()) continue;

    const relativePath = relative(rootDir, absolutePath).replace(/\\/g, "/");
    if (shouldScanFile(relativePath)) {
      files.push(relativePath);
    }
  }
}

export function listScannedSourceFiles(projectRoot: string): string[] {
  const files: string[] = [];
  for (const sourceRoot of SOURCE_ROOTS) {
    const absoluteRoot = join(projectRoot, sourceRoot);
    walkDirectory(projectRoot, absoluteRoot, files);
  }
  return files.sort();
}

export function findRawImgElementViolations(projectRoot: string): string[] {
  const violations: string[] = [];

  for (const relativePath of listScannedSourceFiles(projectRoot)) {
    const content = readFileSync(join(projectRoot, relativePath), "utf8");
    if (RAW_IMG_PATTERN.test(content)) {
      violations.push(relativePath);
    }
  }

  return violations;
}
