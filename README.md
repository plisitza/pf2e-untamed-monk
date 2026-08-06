# PF2e Untamed Monk - Shapeshifting Macros (Remaster)

Foundry VTT macros for playing battle forms in Pathfinder Second Edition (Remaster): the untamed form focus spell and the slot-cast form spells (animal form, aerial form, and the rest), with an attack roller that applies the correct attack modifier under the substitution rules, including Dex-based (finesse) unarmed attacks.

This is a maintained fork of [drexl93/pf2e-shapeshifting](https://github.com/drexl93/pf2e-shapeshifting), which has been unsupported since 2020. Full credit to drexl93 for the original design and nearly all of the code. MIT licensed, as was the original.

## Why this fork exists

The PF2e system's built-in battle form effects construct every form strike Strength-keyed and compare "your own attack modifier" against that Strength-based number. No form spell attack in the game carries the finesse trait, so a character whose best unarmed attack is Dex-based (a monk with finesse fists, for example) can never reach their real modifier through the system implementation.

These macros implement the other reading of "if your unarmed attack modifier is higher, you can use it instead": the modifier being compared and substituted is your best unarmed attack modifier as it appears on your sheet, Dex and all. If your table rules it that way, this is, as far as we know, the only tooling that supports it.

## What you get

Three macros in one compendium:

- **Untamed Form** - transform via the untamed form order spell (the spell once known as wild shape). Feat-gated form list (Insect Shape, Soaring Shape, Ferocious Shape, Elemental Shape, Plant Shape, Dragon Shape, Monstrosity Shape, True Shapeshifter), automatic rank selection (Auto = half level rounded up), token size and image switching, temp HP, speeds, skill adjustments, AC, and the own-modifier substitution with its +2 status bonus when your unarmed attack modifier strictly exceeds the form's. Click again to revert.
- **Spell Shape** - the same treatment for slot-cast form spells. You choose the spell and the rank you are casting at. Substitution here is plain (no +2), again only when your modifier is strictly higher.
- **Shape Strike** - the attack roller for whichever form you are in. Choose the attack, then First / Second / Third+ buttons apply the multiple attack penalty (agile-aware). Includes a Stunning Blows button that posts the monk feat's Fortitude prompt at your live class DC.

While transformed, use Shape Strike and only Shape Strike. The strikes on your character sheet are the system's battle form implementation and will roll different numbers.

## Installation

Paste this manifest URL into Foundry's Install Module dialog:

    https://raw.githubusercontent.com/plisitza/pf2e-untamed-monk/master/module.json

Requires Foundry v11+ and the PF2e system. No other module dependencies (the original's Furnace requirement is gone; modern Foundry runs async macros natively).

Open the "Untamed Monk Macros" compendium and drag the macros to your hotbar.

## Changes from upstream (v7.0.0)

- Remaster terminology throughout. Actors with the legacy "Wild Shape" feat still work; the feat gate accepts both eras' names. All other shape feat names are unchanged in the Remaster.
- Data paths modernized for Foundry v11/v12: actor.system, prototypeToken, texture.src, game.user.id, actor.items.contents, and the Statistic API for skills.
- Senses, resistances, and weaknesses are now delivered through a single temporary Effect item carrying Sense / Resistance / Weakness rule elements, created on transform and deleted on revert. Modern character sheets do not accept direct writes to those fields; this also means the changes show up as a visible effect icon.
- Spell Shape now implements own-modifier substitution for slot-cast form spells (strictly higher, no +2). Upstream computed the comparison value but never applied it.
- Shape Strike gains the Stunning Blows button.
- Compendium rebuilt as a LevelDB pack (NeDB support ended with Foundry v11). JSON sources live in packs-source/ and the pack is compiled by the build script.

## Rule interpretations

The original's documented stances are retained: the substitution comparison ignores item bonuses (the conservative reading; a commented block in the code lets you count Handwraps of Mighty Blows if your table rules otherwise), striking runes do not modify form damage dice, form temp HP replaces existing temp HP, and item bonuses / armor check penalty do not apply to skills while transformed.

Added stances in this fork, both ties-to-the-form:

- Untamed form: "when you choose to use your own attack modifier ... you gain a +2 status bonus" applies only when your own unarmed attack modifier strictly exceeds the form's.
- Slot-cast form spells: "if your unarmed attack bonus is higher, you can use it instead" is plain substitution, no bonus, again strictly higher.

## Known limitations

- Shape Strike does not read conditions (frightened, sickened, and so on); adjust manually, as with the original.
- Humanoid form / Anthropomorphic Shape are not supported (no data for them, upstream or here).
- Revert before ending a session. If a system update changes data structures while you are transformed, the stored originals may not restore cleanly. This was the original author's advice and it stands.

## Building from source

    npm install
    npm run release

This compiles packs-source/ into the LevelDB pack and produces pf2e-untamed-monk.zip. The three macro sources are also mirrored as plain files in scripts/ for reading and for pasting directly into world macros.

## Credits

Original module and design: drexl93 (Some Knucklehead#4725). Fork maintenance: plisitza. License: MIT.
