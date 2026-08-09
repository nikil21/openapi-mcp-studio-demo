# Product Demo Recording Checklist

## Before Recording

- [ ] Use a clean browser profile at 1440 x 900 with bookmarks, extensions, notifications, and unrelated tabs hidden.
- [ ] Confirm the Studio shows the Configurable MCP App Builder title and the `final-test` project.
- [ ] Confirm GitHub public API access is available.
- [ ] Confirm the dedicated Manufact runtime is reachable and the Repository Briefing prompt succeeds twice.
- [ ] Confirm the Publish screen has a published version and no private identifiers are visible.
- [ ] Confirm the Manufact Chat and deployment-history screens are cropped/redacted like the committed Phase 5 assets.
- [ ] Close unrelated applications and enable Do Not Disturb.
- [ ] Test the microphone and screen recording source.

## Recording

- [ ] Record one 105-second take using `PRODUCT_DEMO_SCRIPT.md` and `PRODUCT_DEMO_SHOT_LIST.md`.
- [ ] Keep the GitHub Repository Briefing as the only hero flow.
- [ ] Say that activation is an explicit deployment step; do not imply automated deployment.
- [ ] Keep the cursor movement deliberate and avoid rapid zooming or scrolling.
- [ ] Stop immediately if a credential, personal detail, private identifier, or error appears.

## Retry Plan

1. If GitHub API data is slow or rate-limited, wait five minutes and retry the preflight prompt. Do not record a failed call.
2. If the runtime is unavailable, restart the already-linked dedicated Manufact deployment using the documented manual activation command, wait for it to become healthy, and rerun the preflight prompt twice.
3. If Studio state is incomplete, use the existing `final-test` published configuration; do not change production configuration solely for recording.
4. If the recording contains private data, discard that take and rerecord after correcting the browser crop or redaction.

## After Recording

- [ ] Trim to 90-120 seconds without removing the problem, configure, publish, run, or close sections.
- [ ] Review the full exported video for private data and audible notifications.
- [ ] Add captions if hosting makes it simple.
- [ ] Upload as an unlisted Loom, YouTube, or comparable public-with-link video.
- [ ] Test the video URL in an incognito browser.
- [ ] Add the verified link to `docs/application/APPLICATION_LINKS.md` and replace the README demo placeholder.
