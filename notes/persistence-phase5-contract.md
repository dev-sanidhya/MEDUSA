Scope
- Refine personalization UX so it feels integrated into the MEDUSA flow instead of bolted on.
- Move preference capture away from the welcome screen and into the look-selection / post-tutorial flow.
- Reduce explicit profile inputs to the highest-signal fields for shipping.

Constraints
- Do not change the underlying persistence model.
- Keep all personalization server-backed.
- Prefer fewer, clearer user choices over exhaustive controls.

Verification
- npm run build
- npm run lint
- Verify `/app` desktop flow through welcome, analysis, look selection, and tutorial.

Exit Criteria
- Welcome screen no longer asks for onboarding.
- Look selection presents a clear personalized recommendation area.
- Preference editing is available at the moment it is useful.
- Post-tutorial follow-up feels curated instead of like a form dump.
