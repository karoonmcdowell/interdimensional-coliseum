# Interdimensional Coliseum — v0.4

Open `index.html` in a browser. No dependencies or server required. `engine.js` is also runnable in Node.js for headless matches.

## Duelists
- Bastion: 230 HP, 24% armor, 30 movement speed; dash deals 48 raw damage with ~2.9s cooldown; teleport ~10.8s cooldown.
- Vesper: 125 HP, 3% armor, 132 movement speed; ranged projectile deals 23 raw damage with ~0.72s cooldown; kites and strafes.

## Reproduce trials
`node test.js 1000 10001` uses seeds 10001 through 11000, inclusive. Calibration was conducted on seeds 1–250, and the 1000-seed sample was a separate holdout. This is simulation-level balance, not audience validation. Outcomes depend on AI behavior and starting positions; 50/50 is not guaranteed in every small sample.

## Next priorities
Improve spectator pacing (current median ~9.8 simulated seconds), visual tells, projectile readability, combat event metrics, and evaluate positional/seed biases before expanding to more gladiators.
