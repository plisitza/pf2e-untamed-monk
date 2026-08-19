/**
 * form-art.mjs - battle form token art.
 *
 * WHAT THIS SOLVES
 * The PF2e system does not change a token's image when a battle form lands. It has a rule
 * element for exactly that job, TokenImage, which writes to actor.synthetics.tokenOverrides
 * during data preparation and therefore reverts by itself when the effect is deleted. No form
 * effect in the system's spell-effects pack carries one. This file supplies it.
 *
 * WHERE THE PICTURE COMES FROM
 * The obvious source, the bestiary, is empty: every creature in Monster Core ships with
 * `img: "systems/pf2e/icons/default-icons/npc.svg"` and a completely empty prototypeToken.
 * Paizo sells the art as a separate paid module, which registers itself under
 * `flags.<moduleId>["pf2e-art"]` and is read by the system into `game.pf2e.system.moduleArt`,
 * keyed by compendium UUID. Foundry v13 and later expose a core equivalent at
 * `game.compendiumArt`. Bundling substitute art here is not an option: this is an MIT
 * repository and it has no licence to redistribute anyone's tokens. Referencing paths that
 * ship with Foundry or with the PF2e system is the only lawful route.
 *
 * So resolution is a chain, best source first:
 *
 *   1. game.compendiumArt         - core's mapping, if a token pack registered one
 *   2. moduleArt.map              - the system's mapping, same question, second source
 *   3. OVERRIDE below             - a hand-picked icon, only where step 4 is wrong
 *   4. the effect's own `img`     - what Paizo's data already carries
 *
 * Steps 1 and 2 need a creature UUID, which is what CREATURES supplies. On a server with the
 * Monster Core token pack the art becomes real with no code change here; on a server without
 * one, every form falls through to 3 or 4 and still looks like something sensible.
 *
 * WHY STEP 4 CARRIES ALMOST EVERYTHING
 * Every battle form effect ships with an image, and for most spell families it is already the
 * right one: dinosaur-form on the six dinosaurs, elemental-form on Elemental Form, and the
 * matching glyph on Fey, Ooze, Angel, Demon, Devil, Daemon, Cosmic, Monstrosity, Aberrant,
 * Plant, Pest and Elephant. Deferring to it means this file does not need a row per spell, and
 * new form spells arrive with sensible art already attached rather than needing a code change.
 *
 * WHY THE OVERRIDE TABLE IS ALL ANIMAL FORM
 * Every one of the thirteen Animal Form variants ships with the same picture, a howling grey
 * wolf, which is why they are indistinguishable in the compendium. That is correct for Canine
 * and wrong for the other twelve. Bear is the one variant with art of its own and needs no
 * entry. The rest are listed below, taking a paw print rather than a species where no honest
 * likeness exists in the icon libraries, because a paw print says "beast" without claiming to
 * be one and a wrong animal is worse than a vague one.
 */

const MC = "Compendium.pf2e.pathfinder-monster-core.Actor.";
const MC2 = "Compendium.pf2e.pathfinder-monster-core-2.Actor.";

/** The generic used where the icon libraries hold no honest likeness. */
const BEAST = "icons/creatures/abilities/paw-print-tan.webp";

/**
 * Creature UUIDs for steps 1 and 2, keyed by the compendium id of the spell effect, or
 * `<effect id>:<ChoiceSet selection>` for the forms that ship as one effect with a choice.
 *
 * Ids rather than names because names are localised and a French world would match nothing.
 *
 * Coverage is the druid-reachable spells. The outsider forms - Angel, Demon, Devil, Daemon,
 * Cosmic, Aberrant - are a data-entry project with a long tail of judgment calls, and they
 * already fall through to art the system chose for them. Add rows here when someone cares.
 */
const CREATURES = Object.freeze({
    // Animal Form
    tk3go5Cl6Qt130Dk: MC + "PlkRv9NMKq9TShYf",    // Ape -> Gorilla
    gQnDKDeBTtjwOWAk: MC + "6K4RWus85o8iqy0t",    // Bear -> Grizzly Bear
    BT1ofB6RvRocQOWO: MC2 + "z2qSD3VrlRsXGHT5",   // Bull -> Bison
    sN3mQ7YrPBogEJRn: MC + "BN5Lb6IsQ9Wyu3rL",    // Canine -> Wolf
    ptOqsN5FS0nQh7RW: MC + "kB7FNn3vosp6cqQg",    // Cat -> Leopard
    "1Gax900IAwhLCi4q": MC2 + "Lb11NsmTJpd4YS1p", // Crab -> Giant Crab
    "0B3noZtrBfeHC7ye": MC + "2rMLYkUR47ZCQMUg",  // Crocodile
    F4DTpDXNu5IliyhJ: MC2 + "1wVVI0Jj7MdZ3uHg",   // Deer -> Moose
    j2LhQ7kEQhq3J3zZ: MC2 + "jiLbjz3kic9Uv5b6",   // Frog -> Giant Frog
    rmtCkBCEwyg919N0: MC + "uco1YijAEotYjdnF",    // Orca
    qPaEEhczUWCQo6ux: MC + "uNNOQFvuMq8ZsQkn",    // Shark -> Great White Shark
    kz3mlFwb9tV9bFwu: MC + "Yadztw8CmYuWfA7k",    // Snake -> Python
    // Seal has no counterpart in Monster Core and is deliberately absent.

    // Dinosaur Form
    "0Cyf07wboRp4CmcQ": MC + "CYt04IKRQeiC9Ly9",  // Ankylosaurus
    KkDRRDuycXwKPa6n: MC + "wy8Ve0m3wbHMo1U1",    // Brontosaurus
    oJbcmpBSHwmx6FD4: MC + "wNkS1ArFjS6ZsrPS",    // Deinonychus
    T6XnxvsgvvOrpien: MC + "qtJ36jlcRQw5sBnr",    // Stegosaurus
    iOKhr2El8R6cz6YI: MC + "zAxKR8XWtQm2rqh4",    // Triceratops
    "542Keo6txtq7uvqe": MC + "tpNP1UooPPHMyZye",  // Tyrannosaurus

    // Single-creature forms
    IWD5RehCxZVfgrX9: MC + "1x0BdpVQLX7o3rrA",    // Elephant Form -> Elephant

    // Insect Form
    "dQeERSuUeHv9Rib5:ant": MC + "mEZUTqNIgu0ASApu",       // Giant Ant
    "dQeERSuUeHv9Rib5:beetle": MC + "MkupNnMKqDBElhhp",    // Giant Stag Beetle
    "dQeERSuUeHv9Rib5:centipede": MC + "NRBgcu0LkXXp8mtp", // Giant Centipede
    "dQeERSuUeHv9Rib5:mantis": MC + "KCVKMVYRuq6huXGz",    // Giant Mantis
    "dQeERSuUeHv9Rib5:scorpion": MC + "BWm17BRQYGMLqtNe",  // Giant Scorpion
    "dQeERSuUeHv9Rib5:spider": MC + "A4VgQIHsqJKssQOM",    // Hunting Spider

    // Aerial Form
    "mvMWmP3m9Xawbwpx:bat": MC + "xnpuGO8jEMba9wy5",       // Giant Bat
    "mvMWmP3m9Xawbwpx:bird": MC + "WBPEvEqIGvxeQKlp",      // Eagle
    "mvMWmP3m9Xawbwpx:pterosaur": MC + "bGp2t0UteEYu3BGe", // Pteranodon
    "mvMWmP3m9Xawbwpx:wasp": MC + "6aaBmiOgqZ5h2IhW",      // Giant Wasp
});

/**
 * Step 3. Only the entries where the effect's own image is wrong.
 *
 * Every path here was confirmed present in a stock Foundry install rather than assumed. Four
 * further literal candidates exist and were left out on purpose, since a mediocre likeness is
 * worth less than a consistent generic: Bull could take
 * `icons/creatures/mammals/bull-horned-blue.webp`, Deer
 * `icons/creatures/mammals/deer-movement-leap-green.webp`, Frog
 * `icons/environment/creatures/frog-spotted-green.webp`, and Snake
 * `icons/creatures/reptiles/snake-poised-white.webp`. Each is a one-line addition if someone
 * looks at them and disagrees.
 */
const OVERRIDE = Object.freeze({
    ptOqsN5FS0nQh7RW: "icons/creatures/abilities/lion-roar-yellow.webp", // Cat: a big cat that reads as one
    qPaEEhczUWCQo6ux: "icons/creatures/fish/fish-shark-swimming.webp",   // Shark: an actual shark in profile
    tk3go5Cl6Qt130Dk: BEAST,      // Ape: no ape or gorilla art exists in either library
    BT1ofB6RvRocQOWO: BEAST,      // Bull
    "1Gax900IAwhLCi4q": BEAST,    // Crab
    "0B3noZtrBfeHC7ye": BEAST,    // Crocodile: the only lizard art is a glowing nightmare, not a crocodile
    F4DTpDXNu5IliyhJ: BEAST,      // Deer
    j2LhQ7kEQhq3J3zZ: BEAST,      // Frog
    rmtCkBCEwyg919N0: BEAST,      // Orca: the one whale asset is a stylised tail rather than a whale
    tUelWvSaNZBng42K: BEAST,      // Seal
    kz3mlFwb9tV9bFwu: BEAST,      // Snake
    // Bear and Canine are absent deliberately: their own images are already correct.

    // Insect Form ships one effect for six choices, carrying a spider. Correct for spider,
    // wrong for the other five. No mantis art exists in either library, so that one takes the
    // spell's own glyph rather than a bug that is not a mantis.
    "dQeERSuUeHv9Rib5:ant": "icons/creatures/invertebrates/ant-strength-green.webp",
    "dQeERSuUeHv9Rib5:beetle": "icons/creatures/invertebrates/beetle-stag-yellow-green.webp",
    "dQeERSuUeHv9Rib5:centipede": "icons/creatures/invertebrates/centipede-brown.webp",
    "dQeERSuUeHv9Rib5:mantis": "systems/pf2e/icons/spells/insect-form.webp",
    "dQeERSuUeHv9Rib5:scorpion": "icons/creatures/invertebrates/scorpion-yellow.webp",

    // Aerial Form ships one effect for four choices, carrying a corvid. Correct for bird.
    // No pterosaur art exists, so that one takes the spell's own glyph.
    "mvMWmP3m9Xawbwpx:bat": "icons/creatures/mammals/bat-giant-tattered-purple.webp",
    "mvMWmP3m9Xawbwpx:pterosaur": "systems/pf2e/icons/spells/aerial-form.webp",
    "mvMWmP3m9Xawbwpx:wasp": "icons/creatures/invertebrates/fly-wasp-mosquito-green.webp",
});

/** Marks the rule this file injects, so it can be recognised and never duplicated. */
const TOKEN_ART_SLUG = "untamed-monk-token-art";

/**
 * Build the lookup keys for an effect source, most specific first.
 *
 * The compendium UUID lives at `_stats.compendiumSource`; ItemPF2e.createDocuments sets it
 * before the create hook fires. `flags.core.sourceId` is the older field, kept as a fallback
 * for effects copied around by hand or by other modules.
 *
 * The ChoiceSet selection is readable here because the system resolves every rule element's
 * preCreate callback, dialog included, BEFORE calling super.createDocuments. The chosen value
 * is written to the rule source as `selection`, so by the time the create hook runs the choice
 * is already made.
 */
function artKeysFor(source) {
    const uuid = source?._stats?.compendiumSource ?? source?.flags?.core?.sourceId ?? "";
    const id = String(uuid).split(".").pop();
    if (!id) return [];

    const rules = Array.isArray(source?.system?.rules) ? source.system.rules : [];
    const selection = rules.find((r) => r?.key === "ChoiceSet" && typeof r.selection === "string")?.selection;

    return selection ? [`${id}:${selection}`, id] : [id];
}

/**
 * Steps 1 and 2 for one creature UUID. Returns `{src, scale, from}` or null.
 *
 * The two sources have different shapes, both confirmed by inspection rather than guessed.
 *
 * Core's `game.compendiumArt` entry, as registered by the Paizo token packs:
 *   { actor, img, credit, token: { texture: {src, scaleX, scaleY},
 *                                  ring: {enabled, subject: {texture, scale}} } }
 *
 * The system's legacy `moduleArt.map` entry, from a module using the `pf2e-art` flag:
 *   { img, prototypeToken: { texture: {src, scaleX, scaleY} } }
 *
 * `token` is also tolerated as a bare string, which the system's own art-map validator
 * permits for the legacy mechanism.
 *
 * THE RING SUBJECT IS FORWARDED, BUT ONLY FOR ACTORS ALREADY USING A RING.
 *
 * The packs ship two images per creature. `assets/tokens/...` is framed - an ornate border
 * around the art, meant to be the whole token. `assets/subjects/...` is the same creature
 * with no border on transparency, meant to sit inside a dynamic ring. Verified by rendering
 * both side by side rather than inferred from the file names.
 *
 * A dynamic ring draws its SUBJECT texture, not `texture.src`, and falls back to `texture.src`
 * when no subject resolves. So on a ring-using token, replacing only the texture makes the
 * ring draw the FRAMED art inside the ring: a frame within a frame. Observed on Giant Crab
 * and Moose. Supplying the subject fixes it.
 *
 * It cannot simply be forwarded always, because TokenDocumentPF2e sets `this.ring.enabled =
 * true` unconditionally whenever an override carries a ring, which would switch dynamic rings
 * on for tables that do not use them. Hence `wantsRing`: the actor's own token decides, and no
 * setting is needed.
 *
 * History, so this is not re-litigated: this handling was added, removed on the strength of a
 * screenshot that appeared to show the texture swap alone working, and restored when the
 * removal produced the doubled frames. The screenshot that prompted the removal was of a run
 * WITH this code in place. Check which build a screenshot came from before acting on it.
 */
function packArt(uuid) {
    if (!uuid) return null;

    const core = game.compendiumArt?.get?.(uuid)?.token;
    if (typeof core === "string") return { src: core, from: "compendium art" };
    if (core?.texture?.src) {
        return {
            src: core.texture.src,
            scale: core.texture.scaleX,
            ring: core.ring?.subject?.texture
                ? { texture: core.ring.subject.texture, scale: core.ring.subject.scale }
                : null,
            from: "compendium art",
        };
    }

    const texture = game.pf2e?.system?.moduleArt?.map?.get(uuid)?.prototypeToken?.texture;
    if (texture?.src) return { src: texture.src, scale: texture.scaleX, from: "token pack" };

    return null;
}

/**
 * Does this actor draw its tokens with a dynamic ring? The prototype answers for actors with
 * no token on a scene; placed tokens are consulted too, because a token can be configured away
 * from its prototype. `getActiveTokens` needs a canvas, so it is guarded rather than assumed.
 */
function wantsRing(actor) {
    if (actor?.prototypeToken?.ring?.enabled) return true;
    try {
        return (actor?.getActiveTokens?.() ?? []).some((t) => t?.document?.ring?.enabled === true);
    } catch {
        return false;
    }
}

/** A default icon is not art. Never copy one onto a token. */
function usableImage(img) {
    return typeof img === "string" && img.length > 0 && !img.includes("/default-icons/");
}

/**
 * Produce the TokenImage rule element to append, or null if nothing should be appended.
 * Returns null when the effect already carries a TokenImage of its own, which a user's
 * hand-edited copy legitimately might.
 */
export function tokenArtRuleFor(source, existingRules, actor) {
    if (existingRules.some((r) => r?.key === "TokenImage")) return null;

    const keys = artKeysFor(source);
    if (!keys.length) return null;

    let art = null;
    for (const key of keys) {
        art = packArt(CREATURES[key]);
        if (art) break;
    }

    if (!art) {
        for (const key of keys) {
            if (OVERRIDE[key]) {
                art = { src: OVERRIDE[key], from: "bundled icon" };
                break;
            }
        }
    }

    if (!art && usableImage(source?.img)) {
        art = { src: source.img, from: "effect's own icon" };
    }

    if (!art) return { miss: keys[0] };

    const rule = { key: "TokenImage", slug: TOKEN_ART_SLUG, value: art.src };

    // Only carry a scale that actually does something. TokenDocumentPF2e sets
    // `flags.pf2e.autoscale = false` whenever the override contains a scaleX, and autoscale is
    // what resizes a token when a battle form changes creature size. Forwarding the token
    // packs' scaleX of 1 would therefore disable size scaling in form in exchange for nothing.
    if (Number.isFinite(art.scale) && art.scale > 0 && art.scale !== 1) rule.scale = art.scale;

    // Ring subject art, only where the actor already draws with a ring. The schema floors
    // subject scale at 0.8, so a smaller or missing value is clamped rather than rejected.
    if (art.ring?.texture && wantsRing(actor)) {
        const scale = Number(art.ring.scale);
        rule.ring = { subject: { texture: art.ring.texture, scale: Number.isFinite(scale) ? Math.max(scale, 0.8) : 1 } };
    }

    return { rule, from: art.from + (rule.ring ? " with ring subject" : ""), key: keys[0] };
}
