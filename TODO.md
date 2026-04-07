# Payment /plans 404 Fixed - Deployment TODO

## Current Status
- ✅ Backend code complete: `/payment/plans` implemented & tested locally
- ✅ Frontend integration correct
- ❌ Render deployment out-of-sync (missing new files/routes)

## Deployment Steps

- [ ] **Step 1**: Commit & push all payment changes
  \`\`\`bash
  git add .
  git commit -m \"Fix /payment/plans 404: complete payment implementation with getPlans route/controller\"
  git push origin main
  \`\`\`
- [ ] **Step 2**: Wait Render auto-deploy (1-2 min)
- [ ] **Step 3**: Verify production endpoint
  \`\`\`bash
  curl https://project-8iej.onrender.com/payment/plans
  \`\`\`
  Expected: \`{\"success\":true,\"plans\":[...]}\`

- [ ] **Step 4**: Test full flow
  1. Frontend: http://localhost:5173/payment (or prod frontend)
  2. Plans load without 404
  3. Free plan activates, paid redirects to Stripe

- [ ] **Step 5**: Monitor Render logs for errors
- [x] **Previous TODO**: /admin 404 (unrelated, already handled)

**Next**: Execute Step 1 now to trigger deploy.
