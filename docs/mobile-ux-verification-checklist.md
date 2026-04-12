# Mobile UX Verification Checklist

This checklist turns the current manual UX follow-up into a repeatable pass for the playable mobile slice.

Use it whenever the mobile shell, routing, battle screen layout, pause flow, restore behavior, or result flow changes.

## Scope

This checklist currently covers the implemented Expo/Android slice:

- startup and restore routing
- starter flow
- Home
- active encounter
- pause / leave / retry
- result screens

It does not replace the product-truth docs.
It is the practical manual verification companion to:

- `docs/screens-and-session-flow.md`
- `docs/technical-architecture.md`
- `docs/engineering-standards.md`

## Test Setup

Recommended minimum pass:

- one normal Android phone
- portrait orientation
- sound off for at least one run
- haptics off for at least one run
- one fresh install or cleared local state pass
- one restore-from-saved-state pass

Capture:

- device model
- Android version
- build date / commit
- pass/fail per scenario
- short notes for anything unclear, cramped, or confusing

## 1. Launch And Starter Flow

- Cold launch with no active snapshot routes to starter flow, not Home.
- Starter intro makes the next action obvious within a few seconds.
- `Enter Starter Encounter` feels primary and easy to notice.
- If a saved starter run exists, `Resume Starter Encounter` is visible and understandable.
- If the starter has already been cleared, `Skip To Home` is present and does not overshadow the main action.

## 2. Home

- Home clearly answers what to do next.
- If an active encounter exists, `Resume Encounter` is obvious and believable.
- The current progression card reads as the main action, not decorative info.
- Progress text is readable without feeling like dashboard clutter.
- No fake tabs, dead-end buttons, or placeholder navigation are visible.

## 3. Encounter Readability

- The board feels comfortably readable in one-handed portrait play.
- The board is visually dominant over chrome and surrounding copy.
- HP, moves, countdown, weakness, and resistance are quickly findable.
- The current traced/tapped word preview is easy to read while building a word.
- Selected path order and tile-state markers are understandable at a glance.
- The screen still feels usable on a shorter phone without excessive scrolling.

## 4. Pause Flow

- Pause entry is easy to reach but does not dominate the battle HUD.
- Opening pause does not alter board, HP, moves, or countdown.
- `Resume Encounter` returns to the same meaningful battle state.
- `Restart Encounter` clearly starts a fresh attempt.
- Leaving from pause routes to Home or starter intro correctly based on starter-gate state.
- Returning later through resume does not lose the active encounter.

## 5. Result Clarity

- Win result gives clear closure and a sensible next action.
- Starter win uses `Begin Chapter 1` as the primary CTA.
- Loss result feels encouraging rather than scolding.
- Starter loss uses `Retry` plus return-to-starter flow, not normal Home progression.
- Recoverable-error result reads as a system recovery issue, not player blame.
- Result buttons do not feel crowded or ambiguous.

## 6. Restore And Resume

- Warm resume during battle returns to the same encounter state.
- Process-kill restore returns to battle or result correctly.
- Restoring a resolved encounter lands on result, not stale battle.
- Resume never appears to replay a cast, spell, or lost move.
- Restore flow remains understandable even if the player does not remember the exact pre-interruption moment.

## 7. Notes To Record

For each failed or questionable item, write:

- scenario
- what happened
- what was expected
- severity: `blocker`, `major`, `minor`, or `polish`

## Exit Rule

The slice is in acceptable shape only when:

- no blocker or major issues remain in launch, battle, pause, restore, or result flow
- the board remains comfortably readable on device
- the app never feels like it is lying about whether a run is active, lost, won, or recoverable
