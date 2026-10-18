# Development workflow

1. Implement changes on `develop`; keep `main` as the approved version.
2. Run headless seeded matches and inspect win rates, draws, match lengths, and positional biases.
3. Review the game in a browser before promoting changes.
4. Merge approved changes into `main` and use GitHub Pages as the stable review URL once configured.
5. Keep each iteration scoped and note decisions in `docs/CHANGELOG.md`.

## Baseline

v0.4: Bastion (armored dash tank and teleporter) vs. Vesper (mobile ranged gunner). Previous 1,000-match trial reported 510–490 wins; treat this as a baseline to reproduce, not a guarantee.

## Deployment

GitHub Pages is not yet configured. Do not interpret the repository URL as a playable preview.
