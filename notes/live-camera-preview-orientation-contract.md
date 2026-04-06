Scope: Correct the live selfie camera orientation so the preview feels like a standard front-facing camera while preserving the existing client-side capture and analysis flow.
Constraints: Keep changes focused to the camera capture UI, do not weaken the precision gate or move photo handling server-side, and avoid changing the captured image orientation used for analysis unless required.
Verification: Run `npm run build` after the change. Verify the live camera preview reads naturally and the captured photo still processes through analysis as before.
Exit Criteria: The live preview no longer feels horizontally reversed to the user, capture still works, and the downstream photo-processing path remains intact.
