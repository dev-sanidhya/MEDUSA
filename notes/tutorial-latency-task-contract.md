Scope: Reduce tutorial wait time without lowering tutorial quality or replacing the model-driven routine with a fixed skeleton.
Constraints: Keep the current tutorial richness and look-specific behavior, preserve validation quality gates, avoid background pre-generation, and keep changes aligned with the existing MEDUSA product direction.
Verification: Run `npm run build` after the implementation. If build output or touched files indicate it, run `npm run lint`.
Exit Criteria: Repeated tutorial requests can reuse exact prior results, route-side work overlaps where safe, prompt payloads are leaner without dropping signal, and first-pass tutorial generation succeeds more often so blocking repair frequency drops.
