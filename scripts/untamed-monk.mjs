/**
 * pf2e-untamed-monk - battle form adjustments applied on top of the PF2e system's own
 * implementation.
 *
 * WHAT THIS FILE EXISTS FOR
 * The PF2e system implements battle forms natively and, as of pf2e 8.4.0, already delivers
 * almost everything this module would otherwise have to do: form statistics and scaling,
 * senses, speeds, size, temp HP, handwrap potency riding the substituted modifier while
 * striking correctly does not, ghost touch, Metal Strikes, the untamed form +2 status bonus
 * with its `battle-form:own-attack-modifier` roll option, and sneak attack's qualification
 * gate, which tags an agile or finesse form strike and correctly refuses jaws.
 *
 * Four things it does not do. This module supplies all four by rewriting a battle form
 * effect's source as it lands on the actor. Each is gated INDEPENDENTLY - an actor can
 * qualify for any, all, or none:
 *
 *   1. DEX RE-KEYING. The shipped form effects hardcode `ability: "str"` on every strike.
 *      A reading held by much of the community is that "if your unarmed attack modifier is
 *      higher, you can use it instead" means the number on your sheet, Dexterity included.
 *      No form attack carries the finesse trait, so the alternative reading leaves a
 *      Dex-keyed monk unable to reach his real modifier. Measured on a level 9 monk in Cat
 *      form: claw rolls +16 with "str" and +18 with "dex".
 *
 *   2. SNEAK ATTACK IN FORM. The system deliberately strips extra damage dice from battle
 *      form strikes in BattleFormRuleElement#applyDamageExclusion. That function classes a
 *      modifier as the form's own - and therefore spares it - when its predicate contains
 *      the literal string "battle-form". So the rule below is the system's own sneak
 *      DamageDice with that one entry added, which simultaneously scopes it to battle form
 *      (so it cannot double up with the system's rule outside form) and exempts it from the
 *      strip. Dice count and faces still read the actor flags the rogue class sets, so the
 *      dice scale with level and feats on their own.
 *
 *   3. TOKEN ART. The system changes everything about a battle form except what the token
 *      looks like. See form-art.mjs, which owns the mapping and the art resolution chain.
 *      This one is gated on nothing but the setting: which picture a token shows has no
 *      bearing on anyone's build, so there is no reason to restrict it to qualifying actors.
 *
 *   4. TOKEN SIZE ON PF2E 8.7.0. A system regression, not a design gap: 8.7.0 computes the
 *      token's dimensions before BattleForm applies its size, so the actor turns Huge while the
 *      token stays put (foundryvtt/pf2e#23652). See form-size.mjs. Gated on the running system
 *      version and its own setting, so it can be switched off the day upstream fixes it.
 *
 * No rule element can rewrite another item's rule elements, hence a hook. Rewriting rather
 * than shipping forked copies of the form effects is deliberate: Paizo's data keeps arriving
 * through system updates, and a fork would freeze this module out of their errata.
 */

import { tokenArtRuleFor } from "./form-art.mjs";
import { sizeRuleFor, systemNeedsSizeFix } from "./form-size.mjs";

const MODULE_ID = "pf2e-untamed-monk";
const TOKEN_ART_SETTING = "applyTokenArt";
const FORM_SIZE_SETTING = "fixFormTokenSize";

/** Feat slugs that qualify for Dex re-keying. `wild-shape` is the pre-remaster name,
 *  accepted because some tables allow legacy content and a hand-renamed feat costs
 *  nothing to tolerate. */
const QUALIFYING_FEATS = new Set(["untamed-form", "wild-shape"]);

/** The system's own sneak DamageDice, with "battle-form" added to the predicate.
 *  Do not remove that entry: without it applyDamageExclusion disables the dice. */
const SNEAK_RULE = Object.freeze({
    key: "DamageDice",
    slug: "untamed-monk-sneak-attack",
    label: "Sneak Attack",
    selector: "strike-damage",
    category: "precision",
    diceNumber: "@actor.flags.system.sneakAttackDamage.number",
    dieSize: "d{actor|flags.system.sneakAttackDamage.faces}",
    predicate: ["battle-form", "item:tag:sneak-attack", "target:condition:off-guard"],
});

/** Foundry's sluggify is not depended on here; derive it locally so this file has no API
 *  surface beyond documents themselves. */
function slugOf(item) {
    return item?.slug ?? String(item?.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Gate for Dex re-keying: the actor has the Untamed Form feat AND gains a higher unarmed
 * modifier from Dex than from Strength. Proficiency and potency are identical under either
 * attribute, so the comparison reduces to the ability modifiers themselves.
 *
 * Gating on the build rather than on a specific character means any qualifying monk is
 * handled, and a Strength-based monk is left alone rather than silently weakened.
 */
function qualifiesForDex(actor) {
    if (actor?.type !== "character") return false;

    const feats = actor.itemTypes?.feat ?? [];
    if (!feats.some((f) => QUALIFYING_FEATS.has(slugOf(f)))) return false;

    const dex = Number(actor.system?.abilities?.dex?.mod ?? 0);
    const str = Number(actor.system?.abilities?.str?.mod ?? 0);
    return dex > str;
}

/** Items that mean "this character has sneak attack". Sneak Attacker and Shadow Sneak Attack
 *  both GrantItem the Sneak Attack class feature, so the feature alone would usually do - but
 *  all three are matched so the gate cannot be defeated by grant timing. */
const SNEAK_ITEMS = new Set(["sneak-attack", "sneak-attacker", "shadow-sneak-attack"]);

/**
 * Gate for the sneak injection: the actor actually has sneak attack.
 *
 * DO NOT gate this on `actor.flags.system.sneakAttackDamage`. Those flags are DERIVED - the
 * rogue class writes them with ActiveEffectLike during data preparation - and inside a
 * document-creation transaction the actor can be reset and re-prepared, so at preCreateItem
 * time they are not reliably present. Observed in testing: the flags read {number: 1,
 * faces: 6} on a settled actor, while this hook read the same path as undefined moments
 * earlier in the same transaction and silently skipped the injection.
 *
 * Item presence is source data and is always there. The flags are still what supply the dice,
 * but they are resolved at damage-roll time, long after preparation has settled.
 */
function qualifiesForSneak(actor) {
    const items = actor?.items ?? [];
    for (const item of items) {
        if (SNEAK_ITEMS.has(slugOf(item))) return true;
    }
    // Fallback only: if the flags happen to be prepared, honour them too.
    const n = Number(actor?.flags?.system?.sneakAttackDamage?.number ?? 0);
    return Number.isFinite(n) && n > 0;
}

/** Deep clone without depending on a Foundry global. Rule elements are plain JSON. */
function cloneRules(rules) {
    return JSON.parse(JSON.stringify(rules));
}

/** Read the token art setting without assuming registration succeeded. */
function tokenArtEnabled() {
    try {
        return game.settings.get(MODULE_ID, TOKEN_ART_SETTING) !== false;
    } catch {
        return true;
    }
}

/** Whether the size fix applies: the setting is on AND the running system needs it. */
function formSizeState() {
    if (!systemNeedsSizeFix()) return { on: false, why: `not needed on pf2e ${game.system?.version}` };
    let enabled = true;
    try {
        enabled = game.settings.get(MODULE_ID, FORM_SIZE_SETTING) !== false;
    } catch {
        enabled = true;
    }
    return enabled ? { on: true, why: "on" } : { on: false, why: "off (setting)" };
}

Hooks.once("init", () => {
    game.settings.register(MODULE_ID, TOKEN_ART_SETTING, {
        name: "Change token art in battle form",
        hint:
            "Sets a token's image to match the form it takes. Uses a bestiary token pack's art " +
            "when one is installed, and falls back to a built-in icon when it is not. Turn this " +
            "off to leave tokens alone.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });
    game.settings.register(MODULE_ID, FORM_SIZE_SETTING, {
        name: "Fix battle form token size (PF2e 8.7.0)",
        hint:
            "Works around a PF2e 8.7.0 bug where a battle form changes a character's size but " +
            "not the token's (pf2e issue #23652). Only acts on PF2e 8.7.0 or later. Turn it off " +
            "once the system fixes the bug. Turning it off affects forms applied afterwards; a form " +
            "already in effect keeps the fix until it ends.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });
});

Hooks.on("preCreateItem", (item) => {
    try {
        const actor = item?.parent;
        if (actor?.documentName !== "Actor") return;

        // Read _source, not the prepared document: this edits what is about to be written.
        const source = item._source;
        const rules = source?.system?.rules;
        if (!Array.isArray(rules) || !rules.some((r) => r?.key === "BattleForm")) return;

        // The two stat gates are INDEPENDENT of each other. They were coupled until 8.1.0,
        // which meant sneak attack silently did nothing for a Strength-based monk or a druid -
        // neither of whom has any bearing on which attribute keys a strike. Do not re-couple
        // them. Token art is independent of both and gated on the setting alone.
        const dexEligible = qualifiesForDex(actor);
        const sneakEligible = qualifiesForSneak(actor);
        const art = tokenArtEnabled() ? tokenArtRuleFor(source, rules, actor) : null;
        const sized = formSizeState().on ? sizeRuleFor(source, rules) : null;

        if (!dexEligible && !sneakEligible && !art?.rule && !sized?.rule) {
            if (art?.miss) console.log(`${MODULE_ID} | no art resolved for ${art.miss}`);
            if (sized?.skip) console.log(`${MODULE_ID} | no size rule: ${sized.skip}`);
            return;
        }

        const next = cloneRules(rules);
        let rekeyed = 0;

        if (dexEligible) {
            for (const rule of next) {
                if (rule?.key !== "BattleForm") continue;
                const strikes = rule.overrides?.strikes;
                if (!strikes || typeof strikes !== "object") continue;
                for (const strike of Object.values(strikes)) {
                    if (strike && typeof strike === "object" && strike.ability !== "dex") {
                        strike.ability = "dex";
                        rekeyed += 1;
                    }
                }
            }
        }

        // Idempotence guard: never stack a second copy if one is somehow already present.
        const hasSneak = next.some((r) => r?.slug === SNEAK_RULE.slug);
        const injected = sneakEligible && !hasSneak;
        if (injected) next.push(cloneRules([SNEAK_RULE])[0]);

        if (art?.rule) next.push({ ...art.rule });
        if (sized?.rule) next.push({ ...sized.rule });

        item.updateSource({ "system.rules": next });
        const parts = [
            rekeyed > 0 ? `re-keyed ${rekeyed} strike(s) to Dex` : "no Dex re-key (gate declined)",
            injected ? "injected sneak attack dice" : "no sneak attack on this actor",
            art?.rule ? `token art from ${art.from}` : "no token art",
            sized?.rule
                ? `token size ${sized.size} (level ${sized.level})`
                : `no size rule${sized?.skip ? ` (${sized.skip})` : ""}`,
        ];
        console.log(`${MODULE_ID} | ${actor.name} / "${item.name}": ${parts.join(", ")}`);
    } catch (err) {
        // Never let this break item creation. A silent miss is recoverable; a thrown hook
        // during a transform is not.
        console.error(`${MODULE_ID} | preCreateItem hook failed`, err);
    }
});

Hooks.once("ready", () => {
    console.log(
        `${MODULE_ID} | ready - Dex re-keying, battle-form sneak attack and token art active; ` +
            `form size fix ${formSizeState().why}`,
    );
});
