# Words 'n Wands! Audio-Visual Style Guide

This document defines the intended visual, motion, sound, and haptic style for Words 'n Wands!.

Its purpose is to keep the game feeling:

- magical
- warm
- readable
- family-friendly
- polished without being noisy
- achievable for a mostly AI-assisted solo project

This is the product-level source of truth for:

- visual tone
- UI presentation style
- board and HUD readability priorities
- creature art direction
- icon and effects direction
- animation and motion behavior
- sound and music direction
- haptic behavior
- practical asset workflow constraints

If future mockups, generated art, UI experiments, or implementation details disagree with this document, this document should be treated as the style rulebook until intentionally updated.

---

## 1. Core Philosophy

Words 'n Wands! should feel like a bright magical word game with real charm, not like a generic fantasy battle app wearing a cute skin.

The style should support the core experience:

- reading the board
- understanding the battle state
- enjoying creature personality
- feeling rewarded for smart play
- staying comfortable through repeated short sessions

The presentation should not compete with the board or the player’s thinking time.

### Style priorities
When presentation choices conflict, Words 'n Wands! should prefer:

1. readability
2. warmth
3. clarity of state changes
4. consistency
5. maintainability
6. device-friendliness

over spectacle, realism, or technical impressiveness.

### Practical production rule
This project must remain buildable with mostly AI assistance and limited Adobe skill.

That means the style system should favor:

- reusable visual patterns
- simple exported assets
- code-driven animation where possible
- a small number of strong art rules
- low dependence on advanced custom pipelines

not art workflows that only function if a specialist is hand-crafting every frame.

---

## 2. Tone and Emotional Direction

Words 'n Wands! should feel:

- magical
- playful
- welcoming
- expressive
- lightly adventurous
- clever rather than intense

Words 'n Wands! should not feel:

- grim
- gothic
- horror-driven
- metallic or militaristic
- sarcastic
- hyper-competitive in its presentation
- chaotic or overstimulating

### Creature emotional tone
Creatures should read as:

- mischievous
- unruly
- magical
- cute or cool
- occasionally dramatic

They should not read as:

- grotesque
- gory
- demonic in a hard-horror way
- cruel
- realistic predators meant to frighten children

### Battle emotional tone
Battles should feel like:

- magical duels
- calming wild magic
- restoring order
- outsmarting a creature’s tricks

not brutal combat.

---

## 3. Visual Identity Direction

### 3.1 Overall style direction
The safest and strongest visual direction is:

- 2D-first
- illustration-forward
- shape-clean
- color-rich but not neon-chaotic
- lightly storybook or fantasy-cartoon adjacent
- readable at mobile size

### 3.2 Avoid these style traps
Avoid visual directions that push the game toward:

- dark fantasy RPG box art
- generic match-3 mobile clutter
- flat corporate minimalism with no charm
- over-detailed painted realism that becomes muddy on a phone
- high-VFX chaos that hides state changes

### 3.3 Consistency rule
All major visual surfaces should feel like they belong to the same world:

- title screen
- home screen
- battle screen
- creatures
- buttons
- icons
- result screen
- optional progression surfaces later

The product should not feel like generated assets from five unrelated prompts were glued together.

---

## 4. Color Direction

This document intentionally does **not** lock a final hex palette yet.

It does lock the palette direction.

### 4.1 Palette direction
The palette should lean toward:

- soft jewel tones
- bright magical accents
- warm neutrals for UI framing
- clear contrast for text and board readability
- element colors that are distinct but not aggressive

### 4.2 General color mood
Prefer:

- rich but friendly color
- bright highlights used with restraint
- softer supporting backgrounds behind important gameplay surfaces

Avoid:

- all-black dramatic UI shells
- hyper-saturated rainbow overload
- gray-on-gray readability problems
- heavily washed-out pastel fog that lowers contrast

### 4.3 Element color support
Elements may have associated colors, but those colors must support readability rather than define meaning alone.

Possible directional associations:

- Flame: warm orange / ember red
- Tide: blue / teal
- Bloom: green
- Storm: blue-violet / electric sky tones
- Stone: earthy tan / slate / mineral tones
- Light: gold / white / sunlit yellow
- Arcane: neutral magical violet or soft indigo

These are support cues, not the sole source of meaning.

---

## 5. Board and Tile Visual Rules

The board is the center of the experience and must visually read as such.

### 5.1 Board priority rule
The board should be the visual focal point of the lower half of the screen.

### 5.2 Tile style direction
Tiles should feel:

- clear
- touchable
- magical
- consistent
- easy to differentiate at a glance

They should not feel:

- metallic and harsh
- hyper-beveled and busy
- so flat that they lose affordance
- so decorative that letters become secondary

### 5.3 Letter readability rule
Letters on tiles must remain highly legible.

That means:

- strong contrast
- simple letterforms
- stable centering
- no decorative distortion
- no reliance on glow to make letters readable

### 5.4 Tile-state overlays
Tile states and Wand markers should be visible without turning tiles into clutter piles.

Preferred pattern:

- one clear badge or overlay style per state
- stable iconography
- clean outline or corner marker treatment

Avoid heavy multi-layer state art that swallows the letter.

### 5.5 Board background rule
The board background should support the tiles without competing with them.

Busy textures behind the grid should be avoided.

---

## 6. HUD and UI Presentation Rules

### 6.1 UI framing rule
UI should frame the battle, not dominate it.

### 6.2 HUD style direction
HUD elements should feel:

- magical but clean
- lightly embellished
- readable at mobile size
- restrained in ornamentation

### 6.3 Avoid clutter
Do not overload the battle screen with:

- extra panels
- decorative borders everywhere
- multiple currencies
- oversized badges
- RPG-style stat blocks
- too many simultaneous labels

### 6.4 Primary button direction
Primary buttons should feel friendly, rounded or softly shaped, and clearly tappable.

They should not feel militaristic, sharp, or techno-harsh.

### 6.5 Secondary button direction
Secondary buttons may be quieter, but should remain visually consistent with the same product family.

---

## 7. Creature Art Direction

### 7.1 Creature silhouette rule
Creatures should have clear silhouettes that remain identifiable at mobile scale.

### 7.2 Creature detail rule
Creature illustrations may be charming and detailed, but detail must not become noise.

Important readable features should include:

- face or eye direction
- main body shape
- key magical motif
- element or spell personality cue

### 7.3 Expressiveness rule
Creatures should be expressive enough that players can quickly sense their personality.

Expressions may include:

- smug
- curious
- flustered
- dramatic
- sleepy
- defiant

### 7.4 Theme coherence rule
The creature’s visual design should align with its board behavior.

Examples:

- soot creature looks embery or smoky
- freeze/tangle creature looks planty or prickly
- bubble creature looks watery or buoyant
- glare/dull creature looks radiant or prism-like

### 7.5 Boss art rule
Boss creatures may be more elaborate, but must still remain readable and not drift into grim horror.

---

## 8. Background and Environment Direction

### 8.1 Background role
Backgrounds should create mood without interfering with gameplay readability.

### 8.2 Environment direction
Prefer simple magical habitat backdrops such as:

- glades
- meadows
- twilight groves
- starry clearings
- crystal streams
- rocky caves with friendly magical light

### 8.3 Background restraint rule
Backgrounds should stay soft enough that:

- creature art stands out
- board readability stays strong
- HUD remains readable

### 8.4 Parallax and depth
If parallax or layered depth exists later, it should remain subtle.

Do not make background movement a constant distraction.

---

## 9. Iconography Rules

### 9.1 Icon style direction
Icons should be:

- simple
- readable at small size
- slightly magical
- consistent in stroke/fill style

### 9.2 Icon family coherence
Weakness icons, resistance icons, tile-state markers, Wand markers, and settings icons should all feel like part of one icon family.

### 9.3 Readability rule
Icons should still read clearly in grayscale or low-saturation contexts.

### 9.4 Avoid detail overload
Do not make icons mini illustrations.

They need to work at HUD size.

---

## 10. Typography Rules

### 10.1 UI font direction
Use one highly readable UI font family for the majority of the app.

### 10.2 Decorative font rule
At most one decorative display font may be used later for branding or titles if it remains readable.

Do not build the game around fantasy fonts that make ordinary UI harder to parse.

### 10.3 Hierarchy rule
Typography should clearly distinguish:

- screen title
- section label
- battle-critical value
- button label
- helper text
- flavor text

### 10.4 Flavor-text rule
Flavor text may be slightly more stylized or whimsical, but it must remain clearly secondary to functional UI text.

---

## 11. Motion and Animation Rules

Motion must reinforce understanding.

### 11.1 Core motion goals
Animation should help the player track:

- selected path
- cast confirmation
- tile disappearance
- board collapse
- refill
- damage application
- countdown change
- creature spell activation
- result transition

### 11.2 General motion feel
Motion should feel:

- crisp
- gentle
- responsive
- magical
- controlled

It should not feel:

- explosive all the time
- rubbery in a toy-like way
- shaky for its own sake
- chaotic

### 11.3 Default duration guidance
Use these as early practical defaults unless a specific surface needs something different:

- small input feedback: **100–160ms**
- tile consume / collapse / refill beats: **140–220ms** per stage
- screen transition moments: **180–280ms**
- result-state transitions: **220–320ms**

These are not hard global laws, but they define the intended feel.

### 11.4 Sequencing rule
State changes must animate in readable order, not all at once in a confusing burst.

### 11.5 Screen shake rule
Screen shake should be used sparingly and only where it improves impact clarity.

Ordinary encounters should not constantly shake the screen.

### 11.6 Particle rule
Particles may be used for casts, hits, or magical accents, but they should remain brief and light.

The board must still be readable during and after the effect.

---

## 12. Resolution Order Visualization

The visual system must support the gameplay rule order.

### 12.1 Valid cast visual order
A valid cast should usually present in this order:

1. traced word confirmation
2. element / matchup cue
3. tile consume effect
4. collapse
5. refill
6. damage number / multiplier feedback
7. HP update
8. countdown update
9. creature action if triggered

### 12.2 Why this matters
The player should understand cause and effect.

If the order becomes visually scrambled, the game will feel unfair even when the logic is correct.

---

## 13. Sound Design Direction

### 13.1 Core sound identity
The game should sound:

- magical
- soft-edged
- satisfying
- friendly
- lightly whimsical

It should not sound:

- harsh
- metallic in a combat-heavy way
- hyper-arcade
- too orchestral and serious
- overloaded with constant reward spam

### 13.2 Input sound direction
Tile tracing and cast confirmation sounds should be:

- subtle
- clear
- lightly magical
- short enough not to annoy in repeated play

### 13.3 Success cue direction
A successful cast or strong hit may use:

- rising chimes
- soft magical pops
- tasteful sparkle-like sounds

### 13.4 Error cue direction
Invalid or repeated word cues should be clear but gentle.

They should correct the player without sounding scolding or harsh.

### 13.5 Creature action cues
Creature spell sounds should communicate personality and disruption, but should still fit the family-friendly magical tone.

### 13.6 Audio fatigue rule
Do not design the game around constant loud feedback. The player may hear hundreds or thousands of casts over time.

---

## 14. Music Direction

### 14.1 Music role
Music should support mood and focus.

### 14.2 Music feel
Preferred music qualities:

- calm
- magical
- lightly adventurous
- loop-friendly
- not too busy

### 14.3 Avoid these music traps
Avoid:

- epic constant battle music
- dark fantasy tension scoring
- overly childish novelty music
- melodic clutter that competes with concentration

### 14.4 Encounter music rule
Ordinary encounters should feel comfortable for repeat sessions.

Boss or event content may raise intensity slightly, but still should not break the product’s warmth.

---

## 15. Haptic Direction

### 15.1 Haptic role
Haptics should reinforce interaction and clarity.

### 15.2 Suggested haptic uses
Good early haptic moments include:

- cast acceptance
- strong hit confirmation
- creature action cue
- result confirmation

### 15.3 Avoid noisy haptics
Do not create constant buzzing, harsh long vibrations, or layered haptic spam during ordinary play.

### 15.4 Optionality rule
Haptics must always remain optional and non-essential.

---

## 16. Practical Asset Workflow Rules

This is one of the most important sections for this project.

### 16.1 Asset workflow principle
The visual system should be designed so that it can be maintained with:

- AI-generated mockups or concepts
- simple manual cleanup
- exported flat assets
- limited Adobe skill
- straightforward file replacement

### 16.2 Preferred runtime asset formats
Prefer runtime assets that are easy to export and use, such as:

- PNG
- WebP
- SVG where appropriate
- standard audio exports
- standard font files only when necessary and legally usable

### 16.3 Avoid pipeline complexity early
Avoid early dependence on:

- skeletal rig animation pipelines
- frame-by-frame character animation requirements
- 3D scenes
- complicated particle authoring tools
- advanced shader pipelines
- giant sprite atlas workflows unless clearly needed

### 16.4 Reusable-template rule
Where possible, use reusable visual templates for:

- panels
- buttons
- card frames
- encounter-intro layouts
- result screens
- state badges

### 16.5 Source-file rule
If Adobe source files exist, they should support the runtime asset pipeline, not become a requirement for understanding or editing the product.

The runtime app should depend on exported assets, not `.psd`, `.ai`, or other source project files.

---

## 17. AI-Generated Art and Asset Guardrails

### 17.1 Consistency rule
AI-generated assets must be reviewed for style consistency before being treated as real production content.

### 17.2 Avoid “prompt drift” rule
Do not let every creature or screen be generated with a wildly different visual language.

### 17.3 Cleanup rule
Even if AI generates source imagery, assets should be normalized before in-app use where practical:

- remove unwanted artifacts
- standardize framing
- standardize proportions where needed
- match the established visual family

### 17.4 Readability rule
If an AI-generated asset looks impressive but hurts gameplay readability, it is the wrong asset.

---

## 18. Performance-Friendly Visual Rules

### 18.1 First sacrifice rule
If visuals need to be simplified for performance, cut:

- decorative particles
- extra layered glows
- non-essential motion
- background depth effects

before cutting clarity of gameplay information.

### 18.2 Ordinary-phone rule
Visual ambition should be shaped around ordinary Android phones, not only flagship devices.

### 18.3 Frame stability rule
The game should feel responsive and readable during repeated battle interaction.

Fancy presentation that harms input responsiveness is not acceptable.

---

## 19. Accessibility Cross-Reference Rules

This style guide must remain compatible with the accessibility and device-support document.

That means:

- no color-only meaning
- readable contrast
- sound-off usability
- haptics-off usability
- reduced-motion compatibility
- one-handed practicality
- English-first clarity

If a style decision conflicts with those rules, the accessibility doc wins.

---

## 20. Out of Scope for Early Style Work

The following are out of scope for early milestones unless intentionally documented later:

- cinematic cutscene pipelines
- heavy narrative camera systems
- full voiceover-driven onboarding
- 3D creature rendering
- elaborate skeletal animation frameworks
- ultra-detailed procedural effects systems
- asset pipelines that require specialist Adobe work for every iteration

These may be explored later only if the core game truly earns them.

---

## 21. Summary Rule

Words 'n Wands! should look and sound like:

- a warm magical world
- a clean readable mobile game
- a playful creature battler
- a polished but restrained fantasy experience

The style system should support:

- board readability
- battle clarity
- short repeatable sessions
- family-friendly warmth
- low-drama maintenance
- a realistic solo-builder workflow with AI help

If a future presentation idea makes the game harder to read, harder to maintain, darker than intended, more chaotic than necessary, or more dependent on advanced art skills than the project can realistically support, it should not be treated as an improvement.
