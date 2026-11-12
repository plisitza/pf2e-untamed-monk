/**
 * form-size.mjs - restores battle form token sizing on PF2e 8.7.0.
 *
 * WHY THIS EXISTS
 * PF2e 8.7.0 moved token dimensions into the actor's own active-effect pipeline:
 * ActorPF2e#applyActiveEffects("final") emits the token's width, height, depth and scale from
 * system.traits.size as it stands at that moment. A CreatureSize rule element on an effect
 * (Enlarge, say) has already run by then, from beforePrepareData. BattleForm has not. It
 * constructs its own CreatureSize inside afterPrepareData, after the token's dimensions were
 * computed, so the actor becomes Huge while the token keeps its pre-form footprint and scale.
 * 8.4.0 hid this with a post-preparation re-sync in TokenDocumentPF2e#_onRelatedUpdate
 * (scene.syncTokenDimensions), and 8.7.0 removed it. Reported upstream as foundryvtt/pf2e#23652.
 *
 * WHAT THIS DOES
 * Adds a genuine CreatureSize carrying the form's own size, so the size lands in
 * beforePrepareData the way Enlarge's does. BattleForm's late override then finds the actor
 * already that size and changes nothing. The two are idempotent, so when upstream fixes the
 * ordering this rule becomes redundant rather than wrong. It rides the effect: deleting the
 * effect reverts the size with no teardown.
 *
 * PRIORITY 1000, DELIBERATELY
 * Rule elements run in ascending priority. Running last among beforePrepareData means every
 * other rule element still sees the pre-form size, exactly as it did under 8.4.0, where the
 * form's size arrived later still. It also means the form's size beats an Enlarge that is
 * active at the same time, which matches BattleForm's own last-word behaviour.
 *
 * WHY RESOLVE AT CREATION
 * CreatureSize cannot take BattleForm's rank brackets: RuleElement#resolveValue has no bracket
 * handling, so a bracket object would fail validation. The size is therefore resolved here, the
 * way BattleForm resolves it at runtime. That means the last bracket, in array order, whose
 * start <= the effect's level, MERGED over the base overrides. Merged, not replaced: Animal
 * Form's rank 2 and 3 brackets carry no size and must fall back to the base "med". The effect's
 * level is the cast rank, and it is already in the source at preCreateItem (probed 2026-11-11:
 * level {"value":5} on a rank 5 Animal Form).
 *
 * SURVEYED 2026-11-11 against all 105 BattleForm rules in the PF2e 8.7.0 Item compendia: every
 * size is a plain size word (one is spelled out, "large"), and sizes appear only at
 * overrides.size or brackets[].value.size. Several effects hold one predicated BattleForm per
 * choice. BattleForm's own preCreate marks the unchosen ones `ignored` before this hook runs,
 * so ignored rules are skipped and the chosen rule's predicate is copied.
 *
 * KNOWN DIFFERENCE FROM 8.4.0
 * The size now arrives before CreaturePF2e#prepareDerivedData writes the self:size roll
 * options, so the actor gains self:size:<form size> in form. Stock 8.4.0 never set it, because
 * the form's size arrived after those options were written. That is arguably more correct, and
 * it is noted here because it is a behaviour change.
 */

const SIZE_SLUG = "untamed-monk-form-size";
const PRIORITY = 1000;

/** The first PF2e version known to need this. Earlier versions re-synced token size after
 *  preparation, so injecting there would only add the self:size difference for no benefit. */
const FIRST_AFFECTED = "8.7.0";

/** True when the running PF2e system has the 8.7.0 token sizing order. */
export function systemNeedsSizeFix() {
    try {
        const running = String(game.system?.version ?? "");
        if (!running) return false;
        return !foundry.utils.isNewerVersion(FIRST_AFFECTED, running);
    } catch {
        return false;
    }
}

/** The size BattleForm itself will apply for this rule at this level, or null. */
function resolveFormSize(rule, level) {
    const brackets = Array.isArray(rule?.brackets) ? rule.brackets : [];
    let bracket = null;
    for (const b of brackets) {
        if (Number(b?.start ?? 0) <= level) bracket = b; // findLast, in array order, as BattleForm does
    }
    const size = bracket?.value?.size ?? rule?.overrides?.size;
    return typeof size === "string" && size.length > 0 ? size : null;
}

/**
 * Build the CreatureSize rule for an incoming battle form effect.
 * Returns {rule, size, level}, or {skip: reason} when nothing should be injected.
 */
export function sizeRuleFor(source, existingRules) {
    if (existingRules.some((r) => r?.slug === SIZE_SLUG)) return { skip: "already present" };
    // An effect that already sizes the actor early does not need this, and two CreatureSize
    // rules disagreeing would be worse than the bug.
    if (existingRules.some((r) => r?.key === "CreatureSize")) return { skip: "effect has its own CreatureSize" };

    const form = existingRules.find((r) => r?.key === "BattleForm" && r.ignored !== true);
    if (!form) return { skip: "no active BattleForm rule" };

    const raw = Number(source?.system?.level?.value ?? 0);
    const level = Number.isFinite(raw) ? raw : 0;
    const size = resolveFormSize(form, level);
    if (!size) return { skip: `form sets no size at level ${level}` };

    const rule = { key: "CreatureSize", slug: SIZE_SLUG, value: size, priority: PRIORITY };
    if (Array.isArray(form.predicate) && form.predicate.length > 0) {
        rule.predicate = JSON.parse(JSON.stringify(form.predicate));
    }
    return { rule, size, level };
}
