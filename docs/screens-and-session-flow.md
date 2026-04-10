# Words 'n Wands! Screens and Session Flow

This document defines how Words 'n Wands! should behave from the player’s point of view across:

- app launch
- first-time onboarding
- home flow
- encounter start
- battle interaction
- battle resolution
- result screens
- pause and resume
- retry and restart behavior
- early surface availability

Its purpose is to make the game feel:

- fast to understand
- calm to use
- readable during active play
- reliable when interrupted
- consistent across sessions
- aligned with the product’s family-friendly magical tone

This is the product-level source of truth for screen behavior and player-facing session flow.

If future code, prototypes, or mockups disagree with this document, this document should be treated as the screen/session rulebook until intentionally updated.

---

## 1. Core Philosophy

Words 'n Wands! should feel easy to enter and pleasant to repeat.

The player should be able to:

- launch the app quickly
- understand the current primary action immediately
- start a battle with little friction
- read the battle state at a glance
- recover from interruption cleanly
- finish a session feeling either satisfied or motivated, not punished

Words 'n Wands! should not feel like:

- a cluttered mobile game hub
- a feature maze
- a modal-heavy app
- a confusing RPG shell around a board game
- a noisy screen stack that competes with the actual board

When session-flow or UI decisions conflict, Words 'n Wands! should prefer:

1. clarity
2. speed of understanding
3. battle readability
4. reliable resume behavior
5. low-friction repeat play
6. family-friendly warmth

over novelty, excess UI chrome, or fake complexity.

---

## 2. Scope of This Document

This document owns:

- startup and first-launch routing
- home-screen behavior
- encounter-entry flow
- battle-screen layout priorities
- active battle interaction flow
- result-screen behavior
- pause, background, and restore behavior
- retry/restart behavior
- what player-facing surfaces are available in early milestones

This document does **not** own:

- word-validation rules
- element-tag rules
- damage math
- creature spell authoring rules
- persistence schema
- technical architecture
- analytics payload design

Those belong in other docs.

---

## 3. Core Session Terms

The following terms should be used consistently.

### Cold Launch
Opening the app when it is not currently running.

### Warm Resume
Returning to the app after it was backgrounded.

### First-Time Flow
The player’s first app experience before they have completed an encounter.

### Home
The main player-facing landing screen outside of an active battle.

### Active Encounter
A battle session that is currently in progress and not yet resolved.

### Encounter Result
The win or loss state shown after an encounter concludes.

### Soft Pause
A temporary interruption such as app backgrounding, notifications, or brief task switching.

### Hard Resume
Reopening the app after a process kill or longer interruption and restoring the last active state.

### Starter Encounter
The first battle used to teach the core loop.

### Session Recovery
The act of restoring the player to the correct screen and state after interruption.

---

## 4. App Launch Rules

### Primary launch rule
On launch, the app should route the player to the most appropriate state with minimal friction.

### Launch priority order
On app launch, the routing priority should be:

1. restore an unresolved active encounter if one exists
2. otherwise route a first-time player into the starter flow
3. otherwise route the player to Home

### Canonical starter-gate routing rule
If no unresolved active encounter exists and the starter gate has not been cleared, the app routes into starter flow.

Starter gate truth is:
- `has_completed_starter_encounter = 1` -> starter gate cleared
- `has_completed_starter_encounter = 0` -> starter gate not cleared

A starter loss does not route the player into normal Home progression.

### No wasted startup rule
The app should not make the player step through unnecessary intro layers before they can understand or re-enter the main loop.

### Splash/loading rule
Any splash or loading treatment should be brief and functional.

It should support:

- branding
- loading state clarity
- polish

It should not delay play more than needed.

---

## 5. First-Time Player Flow

The first-time flow should create confidence quickly.

### First-time entry rule
A brand-new player should not land on a cluttered home hub with unclear choices.

The first-time flow should direct them quickly into a **Starter Encounter** or a very lightweight pre-battle setup that leads directly into it.

### First-time flow structure
Recommended first-time sequence:

1. brief title/splash
2. minimal welcome framing
3. starter encounter introduction
4. battle tutorial overlay or guided cues
5. first result screen
6. route to Home

### Minimal welcome framing rule
Before the first battle, any intro copy should be short and functional.

It may communicate:

- that words are spells
- that creatures have weaknesses and countdowns
- that the player should defeat the creature before moves run out

It should not dump lore or deep explanation first.

### First-win rule
The first-time flow should aim to give the player a fast, readable early win.

The goal is confidence, not proving difficulty.

### Account friction rule
The player must not be forced through login, profile setup, cloud prompts, or social setup before understanding the game.

---

## 6. Home Screen Rules

Home is the main landing surface when the player is not inside an active encounter.

### Home purpose
Home should answer these questions clearly:

- what should I do next
- what progress have I made
- what optional side flavors are available
- where can I continue from here

### Home priorities
Home should prioritize, in this order:

1. the main current progression action
2. resume if relevant
3. clear lightweight progress info
4. optional side content
5. settings/profile access

### Home should not be
Home should not feel like:

- a store-first surface
- a live-ops billboard
- a map overloaded with ornaments
- a multi-tab obligation dashboard

### Home implementation matrix

| surface_item | milestone | requirement_level (must/should/may) | gating_condition |
| --- | --- | --- | --- |
| Continue Adventure primary action card (canonical progression target) | M2+ | must | Starter gate cleared and at least one mainline encounter where `is_unlocked = 1` and `best_star_rating = 0`; card points to the first such encounter in canonical order. |
| Resume Encounter entry | M1+ | must | An unresolved active encounter exists and restore routing does not send the player directly into battle. |
| Current progression / next encounter card treatment (visual context around Continue Adventure) | M1+ | should | Mainline progression surface is available on Home. |
| Small progress summary | M1+ | may | Progress snapshot data is available and surface remains lightweight/readable. |
| Daily/weekly flavor entry | M3+ | may | Daily/weekly systems are implemented and remain secondary to main progression. |
| Settings/Profile entry | M1+ | may | Settings/Profile surfaces are implemented and remain secondary to play flow. |
| Creature journal / collection entry | M3+ | may | Journal/collection has meaningful content and does not add clutter. |

### M1-M2 Home negative rules (must not appear)
- dedicated daily/weekly hub surfaces as primary Home content
- creature journal/codex entry points when journal content is empty or placeholder-only
- store/monetization-first placements, tabs, or callouts
- social/competitive hub entry points
- decorative placeholder tabs or “coming soon” Home clutter

### Canonical Milestone 2 Home primary-action rule
After the starter gate is cleared, Home’s primary progression card must point to:

- the first mainline encounter in canonical order where:
  - `is_unlocked = 1`
  - `best_star_rating = 0`

This is the player’s main “Continue Adventure” target.

Replaying an older cleared encounter must not replace this Home primary-action target.
Because of the one-next-unlock model, this should normally be exactly one encounter.

### Resume rule from Home
If an encounter is currently in progress, Home should not pretend there is no active session.

It should surface a clear **Resume Encounter** path or route directly into the battle if the restore rules call for it.

---

## 7. Progression Navigation Rules

### Main progression surface rule
Progression should be readable and lightweight.

### Canonical progression surface encounter states
Each mainline encounter should appear in one of four states:

- `locked`
- `unlocked_unplayed`
- `unlocked_attempted`
- `cleared`

Recommended derivation:
- `locked`: `is_unlocked = 0`
- `unlocked_unplayed`: `is_unlocked = 1`, `win_count = 0`, `loss_count = 0`
- `unlocked_attempted`: `is_unlocked = 1`, `win_count = 0`, `loss_count > 0`
- `cleared`: `best_star_rating > 0`

Cleared encounters show best stars.
Locked encounters show a simple unlock hint based on the immediately preceding encounter.

### Canonical Milestone 2 progression surface
Milestone 2 uses a chapter-linear progression surface.

Recommended presentation:
- ordered chapter cards or chapter strips
- current chapter expanded by default
- past chapters collapsed but reviewable
- future chapters visible in a light locked state
- no branching node web
- no decorative world-map clutter

The surface should show one obvious next encounter, not multiple equally primary choices.

### Locked-content rule
Future encounters may be visually present before unlock, but only if that presentation stays clean and understandable.

Avoid large walls of inaccessible clutter.

---

## 8. Encounter Entry Flow

### Standard encounter entry sequence
When the player starts an encounter, the typical flow should be:

1. player selects or continues an encounter
2. encounter intro panel appears briefly
3. player sees creature name, art, and matchup info
4. battle screen becomes active

### Encounter intro panel
The encounter intro panel may show:

- creature name
- creature portrait
- weakness
- resistance
- a short magical flavor line if desired

It should be brief.

The player should not have to click through heavy scene text before normal battles.

### Starter encounter exception
The starter encounter may include slightly more guided onboarding cues than ordinary encounters.

### Boss/event entry exception
Boss and event encounters may justify a little more presentation weight, but they still should not become long story cutscene funnels unless explicitly documented later.

---

## 9. Battle Screen Layout Rules

The battle screen is the heart of the game and must remain visually disciplined.

### Screen split rule
The battle screen should use a portrait-oriented top/bottom split:

- **top half:** creature, HP, matchup info, countdown, feedback
- **bottom half:** board and player interaction surface

### Battle-screen priority order
The player should be able to identify these things quickly:

1. creature HP state
2. weakness and resistance
3. cast countdown
4. remaining move budget
5. battle board
6. current word trace or current selection
7. recent combat feedback

### Top area contents
The top area should contain:

- creature art
- HP bar
- numeric HP display
- weakness display
- resistance display
- countdown display
- short-form combat feedback such as damage numbers or multiplier text

### Bottom area contents
The bottom area should contain:

- the 6x6 board
- clear tile markers and tile states
- current swipe trace
- any active Wand tile indicator
- a minimal battle utility row if needed, such as pause/settings

### Board dominance rule
The board must remain large enough to read and interact with comfortably on a normal phone.

### No UI clutter rule
The battle screen should avoid:

- large permanent side panels
- unnecessary stat blocks
- multiple currencies
- heavy quest overlays
- decorative HUD noise

---

## 10. Battle HUD Rules

### Always-visible battle information
During active play, the player should always be able to see:

- remaining moves
- creature HP bar
- creature HP numeric value
- creature weakness
- creature resistance
- creature cast countdown

### Not-hidden-in-submenus rule
Battle-critical information must not be hidden behind taps, info icons, or expandable drawers.

### Readability rule
Important battle info should be visually distinguishable without relying only on color.

Use:

- icons
- labels
- simple patterns
- stable placement

### Current word feedback
While tracing a word, the player should be able to see:

- the currently traced letters
- whether the path is visually valid
- the order of selection

The game should not require the player to guess whether the swipe path was read correctly.

---

## 11. Core Battle Interaction Flow

### Standard battle interaction flow
The main interaction loop is:

1. player studies the board
2. player swipes a path
3. game previews the traced word
4. player completes the swipe
5. game validates or rejects the word
6. valid cast resolves with board and damage updates
7. player regains control

### Live tracing rule
As the player traces letters, the game should show the growing word clearly.

### Path feedback rule
The player should receive immediate visual feedback showing:

- selected tiles
- path order
- path continuity

### Submission clarity rule
A completed swipe should feel deliberate and satisfying.

The player should know when the game has accepted the cast attempt.

### Invalid submission behavior
Shared terminology contract (cross-doc):

- **Rejected Cast Feedback**: the full player-facing feedback cycle that starts immediately after a submitted cast is resolved as `submission_kind: 'invalid' | 'repeated'` and ends when the battle HUD returns to idle.
- **RejectedCastResolution**: the canonical gameplay contract from `docs/implementation-contracts.md` section 5.4 that defines invariant gameplay outcomes for rejected casts.

Interaction sequence after submit (required order):

1. **Submit transition:** player ends swipe; UI enters transient `cast_submit_pending` for feedback lock (input disabled for this micro-beat only).
2. **Resolution transition:** gameplay resolves to `RejectedCastResolution`; encounter remains canonical `in_progress` and UI enters `rejected_cast_feedback_active`.
3. **Invariant lock:** during `rejected_cast_feedback_active`, gameplay truth must match contract invariants:
   - no board mutation
   - no countdown mutation
   - no move-budget mutation
4. **Visual treatment:** show a gentle rejection treatment on traced tiles/word chip only (not full-board punishment), then dissolve back to neutral board presentation.
5. **Timeout window:** rejection treatment should complete within a short readable feedback window (`220–420ms` total).
6. **Return-to-idle transition:** after timeout completion, clear transient styling and return to normal playable idle (`battle_input_ready`) with full control restored.

Timing/readability requirements:

- Input lock should be brief and bounded to the feedback window only.
- If multiple invalid submissions happen quickly, each Rejected Cast Feedback cycle should run independently; do not queue long chained lockouts.
- Return-to-idle must be deterministic and should occur no later than `~450ms` from submit end in normal runtime conditions.

When the player submits an invalid or repeated word:

- the battle should remain calm and readable
- the board should not change
- no move should be consumed
- the game should provide a small but clear rejection signal

This signal should correct, not scold.

---

## 12. Valid Cast Resolution Flow

When the player casts a valid word, the resolution should happen in a stable, readable order.

### Standard resolution order
1. valid cast confirmed
2. word/element feedback shown
3. letters burst and disappear
4. board collapses downward
5. new letters refill from the top
6. damage numbers and multipliers are shown
7. creature HP updates
8. countdown updates
9. if countdown expires, creature spell resolves
10. player regains control

### Animation clarity rule
Even if the animations are polished, the resolution order must remain easy to follow.

### Damage feedback rule
On a successful cast, the player should be able to see:

- damage dealt
- element used
- weakness/neutral/resistance result
- Wand bonus or other visible modifier if relevant

### Control-return rule
Once resolution is complete, the player should clearly feel that control is theirs again.

---

## 13. Creature Spell Resolution Flow

### Standard creature-cast sequence
If the countdown reaches zero and the creature survives the player’s cast:

1. creature cast trigger is signaled
2. creature spell animation or cue plays
3. board effect resolves
4. countdown resets
5. the updated board is clearly visible
6. player regains control

### Readability rule
The player must be able to understand:

- that the creature acted
- what it did
- how the board changed
- what the new countdown state is

### No hidden mutation rule
Creature spells should not silently mutate the board without clear feedback.

---

## 14. No-Playable-Moves Recovery Flow

The board system must protect trust if a dead board occurs.

### Dead-board detection rule
If no valid playable words exist, the game should detect that state and recover it.

### Standard recovery flow
Recommended default sequence:

1. the game detects no valid moves
2. a brief readable message or magical cue appears
3. the board triggers a **Spark Shuffle**
4. the board reshuffles into a playable state
5. play resumes

### Player Assist Actions (M1-M2)
No player-invoked hints/clues in M1–M2; only automatic Spark Shuffle dead-board recovery.

Screen and interaction implications:

- Do not surface a hint/clue button, affordance, or modal in M1-M2 battle HUD flows.
- Dead-board recovery remains automatic system behavior and should be communicated as board recovery, not a player-invoked tool.
- Any future hint/clue surface must be added as a deliberate milestone change with updated contracts and economy boundaries.

### Recovery-tone rule
The recovery should feel like the game helping the player, not punishing them for something outside their control.

### Clarity rule
The player should understand that the board was refreshed because no playable moves existed.

---

## 15. Pause and Background Behavior

### Soft pause rule
If the app is backgrounded mid-encounter:

- the encounter should pause safely
- the active state should remain recoverable
- the player should not lose progress casually

### Backgrounding rule
Backgrounding should not:

- discard the current board
- consume a move
- trigger new battle resolution
- change countdown state on its own

### Pause access rule
The battle should have a clear pause or options entry, but it should not dominate the screen.

### Pause menu scope
A pause/options menu may include:

- resume
- restart encounter
- settings
- quit to Home if allowed by product direction

It should not become a second complex interface inside the battle.

---

## 16. Restore and Resume Rules

### Resume-priority rule
If an unresolved active encounter exists, the app should normally restore the player to that encounter rather than silently dropping them elsewhere.

### Restore fidelity rule
On restore, the player should return to the same meaningful battle state, including:

- current board
- remaining moves
- creature HP
- countdown
- tile states
- ongoing encounter identity

### Hard-resume rule
If the process was killed, the app should still restore the most recent safe encounter state if one exists.

### Result-state rule
If the encounter had already resolved before interruption, the player should return to the appropriate result screen rather than a fake in-progress battle.

### No accidental duplication rule
Resume behavior must not:

- replay an already consumed move
- duplicate a cast
- double-apply creature damage
- restore to an older board by accident

---

## 17. Retry and Restart Rules

### Post-loss retry rule
After losing an encounter, the player should have a clear retry path.

### Post-win replay rule
After winning, the player may be allowed to replay for better performance or stars depending on progression rules.

### Restart-from-pause rule
Restarting an encounter should be deliberate, not easy to mis-tap.

### Restart behavior
A restart should create a fresh run of that encounter according to its authored rules.

### Seed behavior rule
Restart must create a fresh encounter attempt with a newly generated `encounter_seed` unless a fixed-seed mode is explicitly active (for authored/testing scenarios).

Deterministic randomness and resume behavior are contract-owned by:

- `docs/randomness-and-seeding-contract.md`
- `docs/implementation-contracts.md`

Player-facing expectation remains: restart means **a fresh attempt**, not a corrupted continuation.

---

## 18. Result Screen Rules

### Result-screen purpose
The result screen should provide:

- closure
- performance clarity
- next-step guidance
- light reward/progression confirmation

### Win result screen should show
- win state
- creature defeated/calm/cleared framing
- star result if applicable
- moves remaining if relevant
- reward or progress gained
- next action options

### Loss result screen should show
- loss state
- encouraging, non-humiliating framing
- optionally the creature’s remaining HP
- retry action
- return or continue path

### Tone rule
Result screens should feel:

- warm
- clear
- motivating

They should not shame the player.

### Next-step buttons
Typical next-step actions may include:

- Continue
- Next Encounter
- Retry
- Return to Home

Do not overload the result screen with too many branches.

### Result-screen next-action rule

After a starter win:
- primary CTA: `Begin Chapter 1`

After a first-clear mainline win that unlocks a new encounter:
- primary CTA: `Next Encounter`

After a replay win with no new unlock:
- primary CTA: `Return to Home` or `Continue Adventure`

After a loss:
- primary CTA: `Retry`
- secondary CTA: `Return to Home`

A loss must never imply that future already-unlocked encounters were relocked.

---

## 19. Daily and Weekly Flavor Surface Rules

Daily and weekly content are currently side flavors, not the center of the product.

### Optionality rule
Daily/weekly entries should not dominate Home or progression during early development.

### Surface placement rule
If daily/weekly content is visible, it should appear as:

- a small optional card
- a side challenge entry
- or a lightweight secondary action

It should not push the main progression off center.

### Missed-content tone rule
If a player ignores or misses daily/weekly content, the app should not make them feel behind or punished.

---

## 20. Surface Availability by Phase

To prevent drift, player-facing surfaces should appear only when they are real enough to justify their presence.

### Early foundation / vertical-slice rule
During early milestones, the player-facing app should prioritize:

- starter flow
- Home
- active battle
- result screen
- minimal settings/profile

### Hidden-until-real rule
The following should remain hidden until they are truly functional enough to matter:

- elaborate world maps
- daily/weekly challenge hubs
- creature journals/codex if empty
- social surfaces
- competitive modes
- store/monetization surfaces
- placeholder tabs

No fake “coming soon” clutter in normal player flow.

---

## 21. Settings and Profile Rules

### Settings scope
Settings should remain lightweight and practical.

Early useful settings may include:

- sound on/off or sliders
- haptics on/off
- reduced motion preference support later
- maybe accessibility-relevant options as they become real

### Profile scope
Profile should remain secondary to actual play.

In early phases, Profile should not become a stat wall or pseudo-live-service dashboard.

---

## 22. Accessibility and Readability Rules

### Battle readability rule
The battle must remain understandable with:

- sound off
- haptics off
- no reliance on color alone

### Text and icon rule
Critical battle info should be reinforced through more than one channel where practical.

### Touch rule
Board interaction targets should feel comfortable on a typical phone.

### Motion rule
Battle animations should support understanding, not compete with it.

If the player cannot track what changed, the motion is too much.

---

## 23. Out of Scope for Early Screen Flow

The following are out of scope for the current early screen/session behavior unless intentionally documented later:

- heavy cinematic campaign transitions
- large story cutscenes between ordinary encounters
- live social hub screens
- real-time multiplayer lobbies
- store-first navigation
- multi-currency economy surfaces
- feature-bloated pause menus
- noisy pre-battle rituals for every standard encounter

---

## 24. Summary Rule

Words 'n Wands! screen and session flow should default to:

- fast launch
- fast understanding
- direct access to the next meaningful action
- a clean Home
- a focused battle screen
- readable cast and creature resolution
- safe pause/resume
- clear results
- low-friction repeat play
- optional side flavors that stay secondary to the main encounter loop

If a future screen-flow idea makes the game slower to understand, harder to resume, more cluttered, or less focused on the board, it should not be treated as an improvement.
