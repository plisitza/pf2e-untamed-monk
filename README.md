# PF2e Untamed Monk

A small Foundry VTT module that adjusts three things about PF2e battle forms, on top of the system's own implementation. It contains no macros, no compendium and no build step - just two script files.

This began as a fork of [drexl93/pf2e-shapeshifting](https://github.com/drexl93/pf2e-shapeshifting), which had been unsupported since 2020, and through v7.0.1 it carried that project's three macros forward. As of v8 almost none of that code is needed: the PF2e system now implements battle forms well enough that only a few behaviours remain worth supplying. Full credit to drexl93, whose design did the heavy lifting for years. MIT licensed, as was the original.

## What it does

**1. Dex re-keying.** The system's form spell effects hardcode `ability: "str"` on every strike. A reading held by much of the community, and one I agree with, is that "if your unarmed attack modifier is higher, you can use it instead" means your own modifier as it appears on your sheet - Dexterity included - rather than a Strength-based recomputation of it. No form attack in the game carries the finesse trait, so under the other reading a Dex-keyed monk can never reach his real number. The module rewrites `ability` to `dex` as a battle form effect lands on a qualifying actor.

Measured on a level 9 monk in Cat form: claw rolls +16 with `str` and +18 with `dex`.

Gated on the actor having the **Untamed Form** feat (the legacy name "Wild Shape" is also accepted) **and** gaining a higher unarmed modifier from Dexterity than from Strength. A Strength-based monk is left alone.

**2. Sneak attack in battle form.** The system deliberately strips extra damage dice from form strikes, in `BattleFormRuleElement#applyDamageExclusion`. That function spares any modifier whose predicate contains the literal string `"battle-form"`. The module injects the system's own sneak `DamageDice` with that one entry added, which simultaneously scopes the rule to battle form - so it cannot double with the system's rule outside form - and exempts it from the strip.

Dice count and faces still read the actor flags the rogue class sets, so the dice scale with level and feats on their own.

Gated only on the actor having sneak attack - the class feature, Sneak Attacker, or Shadow Sneak Attack. **This gate is independent of the Dex one above**, so a Strength-based monk or a druid with a rogue archetype gets it too.

**This second behaviour is an interpretation, and a contested one.** The system's exclusion is deliberate rather than an oversight, and a reasonable GM may read the battle form rules as excluding precision damage outright. The argument for including it is that the restriction governs adjustments to the form's own statistics, while precision damage is a separate quantity with its own immunity rules - a creature immune to precision takes none of it while still taking the form's damage in full. If your GM rules the other way, delete the `SNEAK_RULE` constant and its injection block.

**3. Token art.** The system changes everything about a battle form except what the token looks like, despite shipping a `TokenImage` rule element for exactly that job. The module injects one as the effect lands, and removing the effect reverts the token without any teardown code.

Where the picture comes from depends on what is installed, in this order:

1. A bestiary token pack, if the server has one. The system's compendium creatures ship with no art at all; Paizo sells it separately, and any module that registers art through the `pf2e-art` mechanism will be found and used. This is the good case, and it needs no configuration.
2. A hand-picked icon that ships with Foundry, for the handful of forms whose own icon is misleading.
3. The form effect's own icon, which is what Paizo already chose for it.

The third step carries most of the work. Every battle form effect has an image, and for nearly every spell it is already correct, so this module does not maintain a table of them and a newly published form spell will render sensibly the day it arrives. The second step exists because all thirteen Animal Form variants ship with the same picture of a wolf, along with two other spells that ship one effect for several choices. Those get overridden; nothing else does.

Without a token pack the fallback art is icon-style rather than top-down token art, and where no honest likeness exists in Foundry's libraries the form takes a paw print rather than a picture of the wrong animal. Turn the whole thing off under **Configure Settings** if you would rather your tokens never changed.

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

The form's strikes then appear in the Attacks section of your sheet with the system's own MAP buttons, the token art changes if the form is one the module has a picture for, and the module's adjustments are already applied. The console logs what it changed and where the art came from.

### Tested against

Foundry VTT Release 14 stable, build 365, with PF2e system 8.4.0.

The manifest declares a minimum of Foundry v11 inherited from upstream, but nothing below the versions above has been exercised. This module reads the system's `BattleForm` rule element structure, so a schema change on the PF2e side is the first thing to suspect if it stops working.

## Known limitations

- **Token art is only as good as what is installed.** With a bestiary token pack the module uses real creature art. Without one it falls back to icons that ship with Foundry, which are illustrations rather than tokens and look like it. Several forms - ape, seal, crocodile, orca among them - have no likeness anywhere in Foundry's libraries and take a generic paw print instead.
- **No dinosaur art exists** in a stock install, so all six Dinosaur Form variants share the spell's own glyph.
- **Sneak attack in form is a contested interpretation.** See above. Ask your GM before relying on it.
- Humanoid Form and Anthropomorphic Shape are handled by the system or not at all; this module has no opinion on them.

## Rule interpretations

The comparison between your own modifier and the form's is the system's, not this module's: it is potency-inclusive, and a tie goes to the form. Untamed form's +2 status bonus therefore applies only when your own unarmed attack modifier strictly exceeds the form's.

Striking runes do not increase form damage dice. Property runes such as ghost touch do carry onto form attacks.

**Metal Strikes carries too.** A monk of 9th level or higher has cold iron and silver on the form's attacks, applied at damage-roll time through the system's own `AdjustStrike`. This is easy to miss, and easy to conclude the opposite of: the materials are handed to the damage roll rather than written to the weapon, so they appear nowhere on the strike item and confirming them means reading the system source. It needs nothing from this module.

All of the above is the system's behaviour rather than this module's, and all of it was verified by observation rather than inferred from documentation.

## Building from source

There is no build. The module is `module.json` plus two files in `scripts/`: the hook itself, and the battle form art table it imports.

    npm run release

only produces the distribution zip.

## Credits

Original module and design: drexl93 (Some Knucklehead#4725). Fork maintenance: plisitza. License: MIT.
