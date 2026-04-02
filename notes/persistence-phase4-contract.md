Scope
- Add explicit preference onboarding backed by `medusa_profiles.preferences`.
- Expose profile preference read/write APIs.
- Merge explicit profile preferences into MEDUSA personalization and UI.

Constraints
- Reuse the existing product persistence schema.
- Keep onboarding lightweight and optional, not an account wall.
- Preserve server-side personalization as the source of truth.

Verification
- npm run build
- npm run lint
- Verify `/app` loads and preference save round-trip updates the UI.

Exit Criteria
- Users can save explicit preferences without auth.
- The saved preferences are returned with profile history.
- Tutorial personalization merges explicit profile preferences with feedback-derived memory.
