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

Requires the PF2e system. No other module dependencies (the original's Furnace requirement is gone; modern Foundry runs async macros natively).

Open the "Untamed Monk Macros" compendium and drag the macros to your hotbar.

### Tested against

v7.0.0 was developed and acceptance-tested on:

| Component | Version |
| --- | --- |
| Foundry VTT | Release 14 stable, build 365 |
| PF2e system | 8.4.0 |

The manifest still declares a minimum of Foundry v11 as inherited from upstream, but nothing below the versions above has been exercised. PF2e moves its data schema often - two of the bugs fixed in this release were caused by schema changes, not by anything the module did - so if you are on an older system version and something misbehaves, that is the first thing to suspect.

## Token images

Form switching looks for an image whose filename is your token's filename with the form name appended before the extension:

    Grizel.png       ->  GrizelCat.png, GrizelBear.png, GrizelAnkylosaurus.png

Capitalisation must match the form name as it appears in the transform dialog. Put the files in the same folder as the original token image.

This is deliberate: the module ships no creature art. Paizo's is not redistributable, and Foundry core's creature icons cover fewer than a quarter of the forms (and none of the dinosaurs or dragons). Deriving the filename instead lets you use whatever art you already own.

**If no matching file exists, the token image is simply left alone.** Nothing breaks, and you can adopt the convention for a few favourite forms without providing all of them.

## Changes from upstream (v7.0.0)

- Remaster terminology throughout. Actors with the legacy "Wild Shape" feat still work; the feat gate accepts both eras' names. All other shape feat names are unchanged in the Remaster.
- Data paths modernized: `actor.system`, `prototypeToken`, `texture.src`, `game.user.id`, `actor.items.contents`, and the Statistic API for skills.
- Senses, resistances, weaknesses, **speeds and creature size** are now delivered through a single temporary Effect item carrying Sense / Resistance / Weakness / BaseSpeed / CreatureSize rule elements, created on transform and deleted on revert. Modern character sheets do not accept direct writes to any of those fields; this also means the changes show up as a visible effect icon, and revert restores your original values by simply removing the item rather than replaying a saved snapshot.
- Spell Shape now implements own-modifier substitution for slot-cast form spells (strictly higher, no +2). Upstream computed the comparison value but never applied it.
- Shape Strike gains the Stunning Blows button.
- Compendium rebuilt as a LevelDB pack (NeDB support ended with Foundry v11). JSON sources live in packs-source/ and the pack is compiled by the build script.

### PF2e 8.x compatibility fixes

Three defects made the module non-functional on current PF2e. All three were schema changes on the system's side:

- **Strike lookup.** The substitution logic located your unarmed attack by `action.name === "Fist"`. Modern PF2e does not populate `name` on strikes at all, so the lookup returned `undefined` and the transform threw partway through - leaving actors half-shifted, for every character, not just monks. It now resolves your best unarmed strike by item category.
- **Speeds.** `system.attributes.speed` no longer exists, and `system.movement` is fully derived, so speeds cannot be written to an actor by any path. They are now granted as `BaseSpeed` rule elements.
- **Token size.** PF2e re-derives token dimensions from the actor's size trait, silently reverting any direct write a frame later. Size is now granted as a `CreatureSize` rule element. This also fixes reverting a Small character, which previously left them Medium.

## Rule interpretations

The original's documented stances are retained: the substitution comparison ignores item bonuses (the conservative reading), striking runes do not modify form damage dice, form temp HP replaces existing temp HP, and item bonuses / armor check penalty do not apply to skills while transformed.

Added stances in this fork, both ties-to-the-form:

- Untamed form: "when you choose to use your own attack modifier ... you gain a +2 status bonus" applies only when your own unarmed attack modifier strictly exceeds the form's.
- Slot-cast form spells: "if your unarmed attack bonus is higher, you can use it instead" is plain substitution, no bonus, again strictly higher.

One consequence of granting speeds as rule elements is worth stating, because it changed behaviour: the form now sets your **base** speed, and typed modifiers you already have stack on top of it. A monk with Incredible Movement +10 in a form granting a 40-foot land speed moves 50, not 40. The battle form rules permit special statistics to be adjusted by circumstance bonuses, status bonuses and penalties, so this is the intended reading - but the previous version overwrote the value outright and would have shown 40.

## Known limitations

- **Shape Strike does not apply any of your active modifiers.** Attack and damage are rolled from the form's own numbers, so conditions (frightened, sickened, off-guard), status bonuses like heroism, circumstance bonuses, and aid are all absent. The multiple attack penalty is the only one handled, via the First / Second / Third+ buttons. Adjust manually. Fixing this properly requires the form's attacks to become real system strikes, which is the planned direction for v8.
- **Property runes are not carried onto form attacks.** Ghost touch and similar runes on Handwraps of Mighty Blows have no effect while transformed. Potency does reach the attack roll, but only indirectly, because it is already baked into the unarmed modifier being substituted.
- Spell Shape does not check which form spells you actually know, or which ranks you can actually cast. Every spell and every legal rank is offered.
- Humanoid form / Anthropomorphic Shape are not supported (no data for them, upstream or here).
- Revert before ending a session. If a system update changes data structures while you are transformed, the stored originals may not restore cleanly. This was the original author's advice and it stands.

## Building from source

    npm install
    npm run release

This compiles packs-source/ into the LevelDB pack and produces pf2e-untamed-monk.zip.

The three macro sources are also mirrored as plain files in scripts/ for reading, diffing, and pasting directly into world macros. Only packs-source/ is compiled, so the two copies must be edited together; `npm run check-sync` (which the build runs automatically) fails the build if they drift apart.

Note that Foundry holds a lock on the compiled pack while it is running. Quit Foundry before rebuilding, or the compile step will fail with `LEVEL_LOCKED`.

## Credits

Original module and design: drexl93 (Some Knucklehead#4725). Fork maintenance: plisitza. License: MIT.
