#!/bin/sh
# O script nativo roda mesmo quando origin/branch já aponta HEAD.
exec node scripts/quality/pre-push.mjs npm run check:ci-local
