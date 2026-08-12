/**
 * pf2e-untamed-monk - table rulings applied on top of the PF2e system's own battle forms.
 *
 * WHAT THIS FILE EXISTS FOR
 * The PF2e system implements battle forms natively and, as of pf2e 8.4.0, already delivers
 * almost everything this table needs: form statistics and scaling, senses, speeds, size,
 * temp HP, handwrap potency riding the substituted modifier while striking correctly does
 * not, ghost touch, Metal Strikes, the untamed form +2 status bonus with its
 * `battle-form:own-attack-modifier` roll option, and sneak attack's qualification gate
 * (which tags an agile or finesse form strike and correctly refuses jaws).
 *
 * Two things it does not do, and this module supplies both, by rewriting a battle form
 * effect's source as it lands on an eligible actor:
 *
 *   1. DEX RE-KEYING. The shipped form effects hardcode `ability: "str"` on every strike.
 *      This table rules that a monk substitutes his OWN unarmed attack modifier, which for
 *      a Dex-keyed monk is Dex-based. Measured on a level 9 monk in Cat form: claw rolls
 *      +16 with "str" and +18 with "dex".
 *
 *   2. SNEAK ATTACK IN FORM. The system deliberately strips extra damage dice from battle
 *      form strikes in BattleFormRuleElement#applyDamageExclusion. That function classes a
 *      modifier as the form's own - and therefore spares it - when its predicate contains
 *      the literal string "battle-form". So the rule below is the system's own sneak
 *      DamageDice with that one entry added, which simultaneously scopes it to battle form
 *      (so it cannot double up with the system's rule outside form) and exempts it from the
 *      strip. Dice count and faces still ride the actor flags the rogue machinery sets, so
 *      the ladder scales itself.
 *
 * No rule element can rewrite another item's rule elements, hence a hook. Rewriting rather
 * than shipping forked copies of the form effects is deliberate: Paizo's data keeps arriving
 * through system updates, and a fork would freeze us out of their errata.
 */

const MODULE_ID = "pf2e-untamed-monk";

/** Feat slugs that qualify for Dex re-keying. `wild-shape` is the pre-remaster name,
 *  tolerated because the table allows legacy content and a hand-renamed feat is cheap
 *  to accept. */
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
 * Gating on the build rather than on a named character means a second monk at the table is
 * handled correctly, and a Strength-based monk is left alone rather than silently nerfed.
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
 * rogue machinery writes them with ActiveEffectLike during data preparation - and inside a
 * document-creation transaction the actor can be reset and re-prepared, so at preCreateItem
 * time they are not reliably present. Observed 2026-08-12: a probe read {number:1, faces:6}
 * off a settled actor moments before this hook read the same path as undefined and silently
 * skipped the injection.
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

Hooks.on("preCreateItem", (item) => {
    try {
        const actor = item?.parent;
        if (actor?.documentName !== "Actor") return;

        // Read _source, not the prepared document: we are editing what is about to be written.
        const rules = item._source?.system?.rules;
        if (!Array.isArray(rules) || !rules.some((r) => r?.key === "BattleForm")) return;

        const dexEligible = qualifiesForDex(actor);
        const sneakEligible = dexEligible && qualifiesForSneak(actor);
        if (!dexEligible) return;

        const next = cloneRules(rules);
        let rekeyed = 0;

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

        // Idempotence guard: never stack a second copy if one is somehow already present.
        const hasSneak = next.some((r) => r?.slug === SNEAK_RULE.slug);
        if (sneakEligible && !hasSneak) next.push(cloneRules([SNEAK_RULE])[0]);

        if (rekeyed > 0 || (sneakEligible && !hasSneak)) {
            item.updateSource({ "system.rules": next });
            console.log(
                `${MODULE_ID} | ${actor.name} / "${item.name}": re-keyed ${rekeyed} strike(s) to Dex` +
                    (sneakEligible && !hasSneak ? ", injected sneak attack dice" : ", no sneak attack on this actor")
            );
        }
    } catch (err) {
        // Never let this break item creation. A silent miss is recoverable; a thrown hook
        // during a transform is not.
        console.error(`${MODULE_ID} | preCreateItem hook failed`, err);
    }
});

Hooks.once("ready", () => {
    console.log(`${MODULE_ID} | ready - Dex re-keying and battle-form sneak attack active`);
});
