## Scope
- Fix the deployed photo upload failure that occurs during client-side face detection.
- Keep raw photo processing client-side and avoid changing the analysis API contract.

## Constraints
- Do not weaken the existing precision gate or alter geometry output shapes.
- Limit edits to the upload/detection path needed to remove the worker runtime error.
- Avoid touching unrelated local notes/output changes.

## Verification
- npm run build
- npm run lint

## Exit Criteria
- Upload processing no longer depends on DOM-only globals inside the worker path.
- The app still builds and lints successfully.
