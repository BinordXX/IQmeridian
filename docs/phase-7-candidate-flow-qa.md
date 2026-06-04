# Phase 7 Candidate Assessment Flow QA Checklist

## Step 36: Employer-invited candidate flow

- [ ] Candidate opens a valid invitation link.
- [ ] Invalid invitation redirects to a controlled status page.
- [ ] Expired invitation redirects to a controlled status page.
- [ ] Candidate sees instructions before the live assessment begins.
- [ ] Candidate can start the assessment from the instructions screen.
- [ ] Abstract reasoning section loads correctly.
- [ ] Candidate can select answers and see the selected state immediately.
- [ ] Autosave feedback appears subtly and consistently.
- [ ] Timer displays clearly and remains synchronised with backend timing.
- [ ] End of abstract reasoning transitions deliberately into numerical reasoning.
- [ ] Numerical reasoning section loads correctly.
- [ ] Candidate reaches the final item and receives deliberate submission confirmation.
- [ ] Submission processing screen appears after confirmation.
- [ ] Completion screen appears after successful submission.
- [ ] Candidate result visibility follows employer-invited rules.

## Step 37: Consumer-user flow

- [ ] Consumer user can enter the assessment through the correct consumer entry path.
- [ ] Consumer messaging differs from employer-invited messaging where required.
- [ ] Consumer completion screen displays the correct post-assessment language.
- [ ] Consumer result visibility follows consumer rules.
- [ ] Consumer limited summary, where enabled, avoids diagnostic or exaggerated claims.

## Step 38: Interruption and resume cases

- [ ] Page refresh mid-section restores the valid backend session state.
- [ ] Brief disconnect and reconnect triggers session recovery.
- [ ] Browser back attempt triggers controlled warning or handling.
- [ ] Timer expiry during an item locks the expired section state.
- [ ] Returning to a completed session redirects to controlled completion/status handling.
- [ ] Duplicate submission attempt is prevented.
- [ ] Failed autosave does not silently mislead the candidate.
- [ ] Failed submission displays controlled recovery messaging.

## Step 39: Cognitive-friction review

- [ ] Instructions are clear before assessment start.
- [ ] Timing rules are understandable without extra explanation.
- [ ] Section movement rules are clear.
- [ ] Candidates know whether they can move backward within a section.
- [ ] Candidates are not surprised by the section transition screen.
- [ ] Autosave feedback creates confidence without clutter.
- [ ] Submission confirmation clearly distinguishes navigation from final completion.
- [ ] Completion screen clearly marks the end of the testing experience.
- [ ] Result visibility messaging does not overpromise or imply hidden scores unfairly.

## Step 40: Pre-polish refinement standard

- [ ] Initial load feels controlled.
- [ ] Item rendering is fast enough for normal use.
- [ ] Error states are assessment-specific, not generic.
- [ ] Layout is clean on supported laptop and desktop screens.
- [ ] Unsupported mobile access is clearly blocked.
- [ ] Save, timer, section, and submission states use consistent wording.
- [ ] No dashboard shell, unrelated menus, or decorative clutter appears in the candidate flow.

## Step 41: Phase 7 completion criteria

Phase 7 is complete only when a candidate can:

- [ ] Access the assessment correctly.
- [ ] Understand the instructions.
- [ ] Complete abstract reasoning.
- [ ] Complete numerical reasoning.
- [ ] Have responses preserved reliably.
- [ ] Recover from minor disruption.
- [ ] Submit successfully.
- [ ] Receive the correct completion or result feedback.
