# Minesweeper Buddy

Clear the board without setting off a single mine.

Minesweeper Buddy is a clean, classic take on the timeless mine-clearing puzzle. Uncover every safe square on the grid, use the numbers to work out where the mines are hiding, flag the ones you find, and try to finish as fast as you can. Four difficulty levels, a running timer, saved best times, and a couple of handy quality-of-life touches (like resuming a game you left mid-way) round out the experience.

## How to Play

The board is a grid of hidden squares, some of which conceal a mine and the rest of which are safe.

- **Reveal a square** to see what's underneath. If it's a mine, the game ends immediately. If it's safe, it will show either a blank space or a number.
- **Numbers tell you how many mines are hiding in the eight squares touching it** (directly up/down/left/right and diagonally). A "3" means exactly three of its neighboring squares contain mines.
- **Blank (empty) squares** have zero mines touching them. Revealing one automatically reveals all of its connected safe neighbors for you, cascading outward until it hits numbered squares — this is what causes big open areas to clear in one click.
- **Flag a square** you believe contains a mine so you don't accidentally click it, and so you can keep track of your deductions.
- You win as soon as every safe square on the board has been revealed. Any mines you haven't flagged yet are automatically flagged for you at that point, and a celebration animation plays.
- You lose the instant you reveal an actual mine. When that happens, all the other mines on the board are revealed in a quick cascading animation so you can see the full layout, and any flags you placed on squares that turned out *not* to be mines are marked with a cross to show you where you guessed wrong.

Your very first click of a new game is always guaranteed safe — the game only decides where the mines go after you make that first move, and it keeps that square and all of its immediate neighbors mine-free. In other words, you'll never lose on your opening click.

## Controls

| Action | How |
| --- | --- |
| Reveal a square | Left click a hidden square |
| Flag / unflag a square as a suspected mine | Right click a hidden square |
| Chord (auto-clear neighbors) | Double-click a revealed number |

**Chording** is the fastest way to clear a board once you're confident in your flags: if you've already flagged exactly as many mines as a revealed number says are around it, double-clicking that number instantly reveals all of its remaining, unflagged neighboring squares in one go — no need to click each one individually. Be careful, though: if one of your flags is in the wrong place, chording on that number will detonate the real mine you missed.

You can also place flags before you've revealed anything at all — doing so starts the clock, but the mine layout itself isn't locked in until your first actual reveal, so pre-game flags don't affect the safe-first-click guarantee.

## Difficulty Levels

Pick a difficulty from the toggle at the top of the screen at any time — switching immediately starts a fresh board at the new size:

| Difficulty | Grid size | Mines |
| --- | --- | --- |
| Easy | 9 × 9 | 10 |
| Medium | 16 × 16 | 40 |
| Hard | 16 × 30 | 99 |
| Expert | 20 × 35 | 145 |

Your chosen difficulty is remembered the next time you open the game, and the board scrolls within its own frame if it's too large to fit on screen — larger boards (Hard and Expert especially) are easiest to play on a wider screen. Click the difficulty you're already on again at any time to abandon the current board and start a fresh one at the same size.

## Features

**Live scoreboard.** The toolbar always shows three things at a glance:
- **Mines remaining** — the mine count minus the number of flags you've currently placed. Note this is just a counter to help you keep track, not a hard limit — you can still place more flags than there are actual mines if you want, and the number will go negative to reflect that.
- **Time elapsed** — starts counting the moment you make your first move (a reveal or a flag) and stops the instant you win or lose.
- **Best time** — your fastest ever win for the *currently selected difficulty*.

**Best times / High Scores.** Every difficulty level tracks its own personal-best completion time. Click the trophy/award icon in the top bar to open the High Scores list, which shows your best time for Easy, Medium, Hard, and Expert side by side. You can clear all saved best times from that same panel if you want a fresh start.

**Automatic save & resume.** Your in-progress game is continuously saved as you play. If you close the tab or refresh the page in the middle of a game, the next time you open Minesweeper Buddy it will ask whether you'd like to resume exactly where you left off (same board, same revealed/flagged squares, same elapsed time) or start over.

**Share Progress.** The share icon in the top bar copies a special link to your clipboard that captures the exact state of your current game — every revealed square, every flag, and your elapsed time. Send it to yourself or open it on another device/browser to pick up the identical game right where you left it.

**Win and loss animations.** Winning triggers a colorful confetti burst along with a banner announcing your time (and letting you know if it's a new personal best). Losing triggers a small explosion effect and a screen shake on the mine you hit, followed by the rest of the mines being revealed in a quick cascading sequence.

**Numbered clues in color.** Each number is color-coded (1 through 8), matching the traditional Minesweeper look, making it faster to scan the board at a glance.

**Theme & accent settings.** The settings (gear) icon lets you switch between light and dark themes and pick an accent color for the interface, so you can match the game to your preference or lighting conditions.

**Accessible board.** Every square has a descriptive label (its position, and whether it's hidden, flagged, revealed, a number, or a mine), and animations are automatically toned down if your system is set to reduce motion.

## Tips

- Start by clicking anywhere near the middle of the board — larger open areas tend to reveal more free space at once, giving you more information to work with early on.
- Only flag a square when you're sure it's a mine. Since the "mines remaining" counter is just informational and not enforced, misplaced flags won't break the game, but they can throw off your own counting and block a chord from working correctly.
- Use chording (double-clicking a satisfied number) to speed through sections of the board where you've already worked out all the mines nearby, rather than clicking each safe square one at a time.
- If a number's count already equals the number of *hidden* (unflagged) neighbors it has, every one of those hidden neighbors must be a mine — flag them all.
- Conversely, if a number's count is already satisfied by its flagged neighbors, every other hidden neighbor around it is guaranteed safe to reveal.
- On the larger Hard and Expert boards, use the scrollable board area to pan around — you don't need to shrink your browser to see the whole grid at once.
- Chasing a new best time? Check the High Scores panel before you start so you know exactly what time you're trying to beat for that difficulty.
