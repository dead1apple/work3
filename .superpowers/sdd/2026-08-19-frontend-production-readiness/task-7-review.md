Code Review - Task 7 Frontend Production Readiness
==================================================

Spec Compliance
---------------
- `src/utils/review.js:13` normalizes only the review image URL field, preserves trim/dedupe/limit behavior, and now rejects anything whose parsed protocol is not `https:` at `src/utils/review.js:19`-`src/utils/review.js:20`.
- `src/views/auth/Register.vue:5` imports the existing `sendCode` API export; the only production `getMockCode` reference remains in `src/api/auth.js:6`, so the mock-code endpoint is not exposed by the registration UI.
- `src/utils/auth.js:30` trims and validates phones with `/^1[3-9]\d{9}$/`, and `src/views/auth/Register.vue:56` submits registration with the trimmed phone value.
- `src/utils/auth.js:78`-`src/utils/auth.js:83` gates duplicate sends while sending/counting down and calls `sendCode({ phone: normalizedPhone })`, matching the required payload shape.
- `src/utils/auth.js:83`-`src/utils/auth.js:91` handles promise rejection by clearing `sending` in `finally` and starts the countdown only in the fulfilled path.

Strengths
---------
- The registration send flow is extracted into a small testable helper at `src/utils/auth.js:36`, which makes concurrency and timer behavior much easier to exercise without mounting Vue.
- The added tests cover the key happy and failure paths: HTTPS acceptance/rejection in `tests/review.test.js:24`-`tests/review.test.js:28`, single-flight send behavior in `tests/auth.test.js:217`-`tests/auth.test.js:248`, send failure without countdown in `tests/auth.test.js:250`-`tests/auth.test.js:261`, and timer cleanup after a started countdown in `tests/auth.test.js:263`-`tests/auth.test.js:280`.

Critical Issues
---------------
- None.

Important Issues
----------------
- [BUG] In-flight SMS sends can create a countdown interval after the component has unmounted. `Register.vue` calls `codeSender.cleanup()` in `onUnmounted` at `src/views/auth/Register.vue:48`-`src/views/auth/Register.vue:50`, but `cleanup()` only clears the currently known `timerId` at `src/utils/auth.js:93`-`src/utils/auth.js:98`. If `sendCode` is still pending when unmount occurs, no interval exists yet; when the promise later resolves, `startCountdown()` still runs at `src/utils/auth.js:83`-`src/utils/auth.js:86` and creates a new interval at `src/utils/auth.js:61`-`src/utils/auth.js:69`. This violates the cleanup requirement and can leak a timer/update state after the registration view is gone. Add a disposed/cancelled flag or generation token so cleanup invalidates pending sends, and cover "cleanup before send resolves" with a regression test.

Minor Issues
------------
- [SCOPE] The commit includes `.superpowers/sdd/2026-08-19-frontend-production-readiness/task-7-implementer-report.md:1`. The task's commit step only staged product/test files, and the binding constraints say not to commit generated or scratch process artifacts outside task scope. Remove this report from the implementation commit unless the parent workflow explicitly wants process reports tracked.

Assessment
----------
Verdict: NEEDS CHANGES. The main behavior is close and the tests are well targeted, but the in-flight unmount case is a production timer leak in the exact workflow this task was meant to harden.
