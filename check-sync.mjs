// Guard: scripts/*.js must stay byte-identical to the matching macro's `command`
// field in packs-source/. Only packs-source/ is compiled into the shipped pack
// (see build.mjs); scripts/ is the readable mirror used for review, grep, diffs
// and syntax checking, and is also shipped inside the release zip as reference.
//
// Because nothing structurally links the two, they can silently drift, and an
// edit to scripts/ alone changes NOTHING at runtime. This check makes that
// failure loud instead of silent. It runs automatically before `npm run build`
// via the `prebuild` lifecycle script, so `npm run release` is gated too.
//
// PLANNED (first v8 commit): invert this arrangement — make scripts/ the single
// source of truth and generate each macro's `command` at build time, after which
// drift becomes structurally impossible and this file can be deleted.

import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const PACK_SOURCE = "packs-source/pf2e-untamed-monk";
const SCRIPT_DIR = "scripts";

// packs-source file names are kebab-case, scripts/ file names are camelCase:
// untamed-form.json <-> untamedForm.js
const kebabToCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const jsonFiles = readdirSync(PACK_SOURCE).filter((f) => f.endsWith(".json")).sort();

if (jsonFiles.length === 0) {
  console.error(`check-sync: no .json files found in ${PACK_SOURCE}`);
  process.exit(1);
}

let failures = 0;

for (const file of jsonFiles) {
  const jsonPath = join(PACK_SOURCE, file);
  const scriptPath = join(SCRIPT_DIR, `${kebabToCamel(basename(file, ".json"))}.js`);

  let doc;
  try {
    doc = JSON.parse(readFileSync(jsonPath, "utf8"));
  } catch (err) {
    console.error(`  INVALID  ${jsonPath} is not parseable JSON: ${err.message}`);
    failures++;
    continue;
  }

  if (typeof doc.command !== "string") {
    console.error(`  NO-CMD   ${jsonPath} has no string \`command\` field`);
    failures++;
    continue;
  }

  let source;
  try {
    source = readFileSync(scriptPath, "utf8");
  } catch {
    console.error(`  MISSING  ${scriptPath} (expected mirror of ${file})`);
    failures++;
    continue;
  }

  if (source === doc.command) {
    console.log(`  ok       ${scriptPath} == ${file} :: command  (${source.length} bytes)`);
  } else {
    console.error(
      `  DRIFT    ${scriptPath} != ${file} :: command  ` +
        `(${source.length} bytes vs ${doc.command.length} bytes)`
    );
    failures++;
  }
}

if (failures > 0) {
  console.error(
    `\ncheck-sync FAILED: ${failures} macro(s) out of sync.\n` +
      `scripts/ and packs-source/ must be edited together — only packs-source/ ships,\n` +
      `so an edit to scripts/ alone has no runtime effect.\n`
  );
  process.exit(1);
}

console.log(`\ncheck-sync: ${jsonFiles.length} macro(s) in sync`);
