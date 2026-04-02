Scope
- Wire saved history and feedback into the MEDUSA client flow.
- Surface recent analyses/tutorials for the anonymous profile.
- Feed lightweight preference memory into tutorial generation and look selection.

Constraints
- Keep the current client-side photo flow unchanged.
- Preserve the premium MEDUSA UI tone and existing stage flow.
- Keep personalization as guidance, not a hard override of face-fit or selected look DNA.
- Do not commit unrelated output artifacts.

Verification
- npm run build
- npm run lint
- Verify /app loads on desktop and shows the new history/feedback surfaces without breaking the flow.

Exit Criteria
- The client loads recent profile history from persistence.
- Users can submit analysis and tutorial feedback from the UI.
- Look selection shows lightweight preference cues.
- Tutorial generation receives a compact personalization profile derived from saved history.
- The increment is committed and pushed to both configured GitHub repos.
