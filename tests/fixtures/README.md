# Test fixtures

`prescription-clear.png` is a synthetic 800×1000 PNG generated at scaffold
time via `sharp` rendering an SVG with a few hand-written-style prescription
lines. It is **not** a real prescription scan and contains no PHI.

The fixture exists only to give the integration and unit tests a deterministic
binary to feed into the pipeline. To regenerate it, see the script in
`/roshetta/specs/.../tasks.md` task T060 or the smoke test.
