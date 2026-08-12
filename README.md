# PF2e Untamed Monk

A small Foundry VTT module that applies two battle form interpretations on top of the PF2e system's own implementation. It contains no macros, no compendium and no build step - just a single hook file.

This began as a fork of [drexl93/pf2e-shapeshifting](https://github.com/drexl93/pf2e-shapeshifting), which had been unsupported since 2020, and through v7.0.1 it carried that project's three macros forward. As of v8 almost none of that code is needed: the PF2e system now implements battle forms well enough that only two behaviours remain worth supplying. Full credit to drexl93, whose design did the heavy lifting for years. MIT licensed, as was the original.

## What it does

**1. Dex re-keying.** The system's form spell effects hardcode `ability: "str"` on every strike. A reading held by much of the community, and one I agree with, is that "if your unarmed attack modifier is higher, you can use it instead" means your own modifier as it appears on your sheet - Dexterity included - rather than a Strength-based recomputation of it. No form attack in the game carries the finesse trait, so under the other reading a Dex-keyed monk can never reach his real number. The module rewrites `ability` to `dex` as a battle form effect lands on a qualifying actor.

Measured on a level 9 monk in Cat form: claw rolls +16 with `str` and +18 with `dex`.

Gated on the actor having the **Untamed Form** feat (the legacy name "Wild Shape" is also accepted) **and** gaining a higher unarmed modifier from Dexterity than from Strength. A Strength-based monk is left alone.

**2. Sneak attack in battle form.** The system deliberately strips extra damage dice from form strikes, in `BattleFormRuleElement#applyDamageExclusion`. That function spares any modifier whose predicate contains the literal string `"battle-form"`. The module injects the system's own sneak `DamageDice` with that one entry added, which simultaneously scopes the rule to battle form - so it cannot double with the system's rule outside form - and exempts it from the strip.

Dice count and faces still read the actor flags the rogue class sets, so the dice scale with level and feats on their own.

Gated only on the actor having sneak attack - the class feature, Sneak Attacker, or Shadow Sneak Attack. **This gate is independent of the Dex one above**, so a Strength-based monk or a druid with a rogue archetype gets it too.

**This second behaviour is an interpretation, and a contested one.** The system's exclusion is deliberate rather than an oversight, and a reasonable GM may read the battle form rules as excluding precision damage outright. The argument for including it is that the restriction governs adjustments to the form's own statistics, while precision damage is a separate quantity with its own immunity rules - a creature immune to precision takes none of it while still taking the form's damage in full. If your GM rules the other way, delete the `SNEAK_RULE` constant and its injection block.

## What the system already does, and this module does not touch

All of the following is the PF2e system's own work. This module does not implement, override or interfere with any of it. Each was confirmed by observation on PF2e 8.4.0 rather than taken from documentation.

- Form statistics and their scaling by spell rank, including AC, skills and temporary hit points
- Senses, speeds and creature size
- Speed stacking, so Incredible Movement's +10 on a form granting 40 feet produces 50
- The restrictive tie, where a tie between your modifier and the form's goes to the form, expressed as a `>=` comparison
- Untamed form's +2 status bonus, applied on the own-modifier branch only
- Handwrap potency riding the substituted modifier
- Striking runes correctly **not** increasing the form's damage dice
- Ghost touch reaching form strikes
- Metal Strikes granting cold iron and silver in form
- Sneak attack's qualification gate, which accepts agile or finesse attacks only, so jaws never qualify
- The multiple attack penalty, conditions, immunities, weaknesses and resistances, and circumstance and status bonuses

Form attacks are ordinary strikes on the character sheet. There is nothing to click but the sheet.

## Installation

Paste this manifest URL into Foundry's Install Module dialog:

    https://raw.githubusercontent.com/plisitza/pf2e-untamed-monk/master/module.json

Requires the PF2e system. No dependencies, no compendium to open, nothing to drag to a hotbar.

## Usage

Cast **Untamed Form** (or any slot-cast form spell) from your character sheet, then drag the resulting effect from the spell listing onto the actor. Casting alone does not apply the effect - that is how the PF2e system works, not something this module changes.

The form's strikes then appear in the Attacks section of your sheet with the system's own MAP buttons, and the module's adjustments are already applied. The console logs what it changed.

### Tested against

Foundry VTT Release 14 stable, build 365, with PF2e system 8.4.0.

The manifest declares a minimum of Foundry v11 inherited from upstream, but nothing below the versions above has been exercised. This module reads the system's `BattleForm` rule element structure, so a schema change on the PF2e side is the first thing to suspect if it stops working.

## Known limitations

- **No token image switching.** v7 derived a per-form token image from your token's filename. The system's battle forms do not do this, and reimplementing it would mean reintroducing the machinery this version exists to delete. If you want per-form art, set it manually or add a `TokenImage` rule element to your own copy of the form effect.
- **Sneak attack in form is a contested interpretation.** See above. Ask your GM before relying on it.
- Humanoid Form and Anthropomorphic Shape are handled by the system or not at all; this module has no opinion on them.

## Rule interpretations

The comparison between your own modifier and the form's is the system's, not this module's: it is potency-inclusive, and a tie goes to the form. Untamed form's +2 status bonus therefore applies only when your own unarmed attack modifier strictly exceeds the form's.

Striking runes do not increase form damage dice. Property runes such as ghost touch do carry onto form attacks.

**Metal Strikes carries too.** A monk of 9th level or higher has cold iron and silver on the form's attacks, applied at damage-roll time through the system's own `AdjustStrike`. This is easy to miss, and easy to conclude the opposite of: the materials are handed to the damage roll rather than written to the weapon, so they appear nowhere on the strike item and confirming them means reading the system source. It needs nothing from this module.

All of the above is the system's behaviour rather than this module's, and all of it was verified by observation rather than inferred from documentation.

## Building from source

There is no build. The module is `module.json` plus one file in `scripts/`.

    npm run release

only produces the distribution zip.

## Credits

Original module and design: drexl93 (Some Knucklehead#4725). Fork maintenance: plisitza. License: MIT.
