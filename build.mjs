// Compiles the LevelDB compendium pack from packs-source/.
// Run: npm install && npm run build
import { compilePack } from "@foundryvtt/foundryvtt-cli";
await compilePack("packs-source/pf2e-untamed-monk", "packs/pf2e-untamed-monk", { log: true });
console.log("Pack compiled to packs/pf2e-untamed-monk");
