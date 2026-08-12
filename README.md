# PF2e Untamed Monk

A small Foundry VTT module that applies one table's battle form rulings on top of the PF2e system's own implementation. It contains no macros, no compendium and no build step - just a single hook file.

This began as a fork of [drexl93/pf2e-shapeshifting](https://github.com/drexl93/pf2e-shapeshifting), which had been unsupported since 2020, and through v7.0.1 it carried that project's three macros forward. As of v8 almost none of that code is needed: the PF2e system now implements battle forms well enough that only two behaviours remain worth supplying. Full credit to drexl93, whose design carried this table for years. MIT licensed, as was the original.

## What it does

**1. Dex re-keying.** The system's form spell effects hardcode `ability: "str"` on every strike. This table rules that a monk substitutes his own unarmed attack modifier, which for a Dex-keyed monk is Dex based. The module rewrites `ability` to `dex` as a battle form effect lands on a qualifying actor.

Measured on a level 9 monk in Cat form: claw rolls +16 with `str` and +18 with `dex`.

Gated on the actor having the **Untamed Form** feat (the legacy name "Wild Shape" is also accepted) **and** gaining a higher unarmed modifier from Dexterity than from Strength. A Strength-based monk is left alone.

**2. Sneak attack in battle form.** The system deliberately strips extra damage dice from form strikes, in `BattleFormRuleElement#applyDamageExclusion`. That function spares any modifier whose predicate contains the literal string `"battle-form"`. The module injects the system's own sneak `DamageDice` with that one entry added, which simultaneously scopes the rule to battle form - so it cannot double with the system's rule outside form - and exempts it from the strip.

Dice count and faces still read the actor flags the rogue machinery sets, so the ladder scales itself with level and feats.

**This second behaviour is a table ruling, not RAW.** The system's exclusion is deliberate rather than an oversight. If your GM rules the other way, delete the `SNEAK_RULE` constant and its injection block.

## What the system already does, and this module does not touch

Verified empirically on PF2e 8.4.0 rather than assumed:

| Behaviour | Handled by |
| --- | --- |
| Form statistics, scaling by rank, AC, skills, temp HP | System |
| Senses, speeds, creature size | System |
| Speed stacking (Incredible Movement +10 on a 40 ft form gives 50) | System |
| Restrictive tie ruling (tie goes to the form, no +2) | System, via a `>=` comparison |
| Untamed form's +2 status bonus on the own-modifier branch | System |
| Handwrap potency riding the substituted modifier | System |
| Striking runes correctly **not** increasing form damage dice | System |
| Ghost touch reaching form strikes | System |
| Metal Strikes granting cold iron and silver in form | System |
| Sneak attack's qualification gate (agile or finesse only, so jaws never qualify) | System |
| Multiple attack penalty, conditions, IWR, circumstance and status bonuses | System |

Form attacks are ordinary strikes on the character sheet. There is nothing to click but the sheet.

## Installation

Paste this manifest URL into Foundry's Install Module dialog:

    https://raw.githubusercontent.com/plisitza/pf2e-untamed-monk/master/module.json

Requires the PF2e system. No dependencies, no compendium to open, nothing to drag to a hotbar.

## Usage

Cast **Untamed Form** (or any slot-cast form spell) from your character sheet, then drag the resulting effect from the spell listing onto the actor. Casting alone does not apply the effect - that is how the PF2e system works, not something this module changes.

The form's strikes then appear in the Attacks section of your sheet with the system's own MAP buttons, and the module's adjustments are already applied. The console logs what it changed.

### Tested against

| Component | Version |
| --- | --- |
| Foundry VTT | Release 14 stable, build 365 |
| PF2e system | 8.4.0 |

The manifest declares a minimum of Foundry v11 inherited from upstream, but nothing below the versions above has been exercised. This module reads the system's `BattleForm` rule element structure, so a schema change on the PF2e side is the first thing to suspect if it stops working.

## Known limitations

- **No token image switching.** v7 derived a per-form token image from your token's filename. The system's battle forms do not do this, and reimplementing it would mean reintroducing the machinery this version exists to delete. If you want per-form art, set it manually or add a `TokenImage` rule element to your own copy of the form effect.
- **Sneak attack in form is a table ruling.** See above.
- Humanoid Form and Anthropomorphic Shape are handled by the system or not at all; this module has no opinion on them.

## Rule interpretations

The comparison between your own modifier and the form's is the system's, not ours: it is potency-inclusive, and a tie goes to the form. Untamed form's +2 status bonus therefore applies only when your own unarmed attack modifier strictly exceeds the form's. Striking runes do not increase form damage dice; property runes such as ghost touch do carry. All of that is the system's behaviour, and all of it was measured rather than inferred.

## Building from source

There is no build. The module is `module.json` plus one file in `scripts/`.

    npm run release

only produces the distribution zip.

## Credits

Original module and design: drexl93 (Some Knucklehead#4725). Fork maintenance: plisitza. License: MIT.
