# Words 'n Wands! Copy Locks and Voice Guide

This document defines the tone, voice, and specific text copy to be used throughout Words 'n Wands!.

Its purpose is to ensure the game maintains its intended identity:
- magical
- warm
- family-friendly
- encouraging
- clear

If future UI implementations, mockups, or content data disagree with the tone outlined in this document, this document should be treated as the source of truth for in-game text.

---

## 1. Core Voice Principles

Words 'n Wands! should sound like a friendly magical guide.

The game should **not** sound:
- aggressive or violent ("Kill", "Destroy", "Slaughter")
- hyper-competitive ("Dominate", "Crush")
- condescending or punishing on failure
- overly technical or robotic

### The Fantasy
The player is using word magic to calm unruly, mischievous creatures, break spells, and restore order to a cozy magical world.

---

## 2. Standard UI Terminology

Use these exact terms for consistency across the app:

| Concept | Approved Term | Avoid Using |
| :--- | :--- | :--- |
| Starting a level | **Play** or **Encounter** | Fight, Battle, Attack |
| Completing a level | **Victory** or **Calmed** | Defeated, Killed, Slain |
| Failing a level | **Out of Moves** | You Died, Game Over, Defeat |
| The play area | **Board** | Grid, Puzzle |
| Using a word | **Cast** | Submit, Enter, Attack |
| Remaining turns | **Moves** | Turns, AP, Stamina |
| Main menu | **Home** | Hub, Base |

---

## 3. Encounter Framing and Results

The result screens are critical for the emotional tone of the game. Failure must not feel punishing.

### 3.1 Victory Screen
When the player wins, the focus should be on success and cleverness.

**Primary Heading (Choose one depending on context):**
- *Victory!*
- *Creature Calmed!*
- *Spell Broken!*

**Subtext/Flavor:**
- *Excellent casting.*
- *The mischief is managed.*
- *Brilliant wordcraft!*

**Action Buttons:**
- *Continue*
- *Next Encounter*

### 3.2 Loss Screen (Out of Moves)
When the player runs out of moves, the focus should be on encouragement and learning. The player did not "die"—they just ran out of magical energy for this attempt.

**Primary Heading:**
- *Out of Moves*

**Subtext/Flavor (Choose one):**
- *The creature's mischief holds... for now. Try again!*
- *Almost had it! A different elemental strategy might help.*
- *Don't worry, the magic is still with you. Give it another try.*

**Action Buttons:**
- *Retry*
- *Return Home*

---

## 4. In-Battle Feedback

During the battle, text must be brief, clear, and readable.

### 4.1 Matchup Feedback
When a word is cast, the elemental matchup should be indicated clearly (alongside icons and colors).

- Weakness hit: **"Effective!"** or **"Super!"**
- Resistance hit: **"Resisted"**
- Neutral/Arcane: (Show damage number only, no special text needed to keep UI clean)

### 4.2 Invalid Word Feedback
When a word is rejected, the text should correct, not scold.

- Too short: **"Words must be 3+ letters."**
- Not in lexicon: **"Not found in spellbook."**
- Repeated word: **"Already cast!"**

### 4.3 Dead-Board Recovery (Spark Shuffle)
When the board has no valid moves, the game rescues the player. The text should frame this as a magical assist, not a player failure.

- **"No spells remaining! Spark Shuffle!"**
- **"The board hums with new magic... Shuffle!"**

---

## 5. Creature Intro Panels

When entering an encounter, the intro should be brief and flavorful, focusing on the creature's personality.

**Format Example:**
- **Name:** *Cinder Cub*
- **Trait:** *A playful spirit of the hearth.*
- **Weakness:** *Tide*
- **Resistance:** *Flame*

Do not write long lore paragraphs. The player wants to see the board.
