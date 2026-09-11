# AI SDK browser stream cleanup

`ai@7.0.94` creates a tracing completion promise for each stream. Its
`openTelemetryChannelSpanContext` returns early outside Node without handling
that promise's rejection. A handled provider error (401, failed fetch, cancel)
therefore also raises an unhandled `NoOutputGeneratedError` in the browser and
opens the Next.js runtime error overlay.

The patch adds the same rejection handler already present in the Node branch
without tracing subscribers. It only settles the unused tracing promise;
Responses errors still propagate to the caller and appear inline in the editor.
Both the published JavaScript and corresponding TypeScript source are patched.

Repro/verification: `pnpm --filter @bluepen/editor exec node --test
src/components/editor/agent/agent-runtime.test.mjs` includes the non-Node tracing
branch. Also verify a real rejected TokenBox request in the dev browser with no
`unhandledrejection` event and no Next.js overlay. Remove this patch once an
upstream SDK version handles the browser completion promise itself.
