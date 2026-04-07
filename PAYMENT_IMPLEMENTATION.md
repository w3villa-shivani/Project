# Payment Gateway Integration & Pricing Plans Implementation

## Overview
This document outlines the complete implementation of Stripe payment integration with time-limited pricing plans (Free, Silver, Gold) for the MEARN authentication project.

## Architecture

### Backend Components

#### 1. Payment Controller (`backend/controllers/paymentController.js`)
Handles all payment-related logic including:
- **Stripe Checkout Session Creation**: `createCheckoutSession()`
  - Validates user and plan
  - Creates Stripe checkout sessions for Silver and Gold plans
  - Returns session ID and publishable key to frontend
  
- **Webhook Handler**: `handleWebhook()`
  - Processes Stripe events (checkout.session.completed, payment_intent.succeeded, charge.refunded)
  - Updates user plan details upon successful payment
  
- **Plan Status Management**: 
  - `getPlanStatus()`: Fetches user's current plan with remaining time
  - `activateFreePlan()`: Activates free plan without payment
  - `getPlans()`: Returns all available plans with pricing and Stripe price IDs

#### 2. Payment Routes (`backend/routes/paymentRoutes.js`)
```
POST   /payment/create-checkout-session    - Creates Stripe checkout
POST   /payment/activate-free               - Activates free plan
GET    /payment/plans                       - Fetches all plans
GET    /payment/plan-status/:userId         - Gets user's plan status
GET    /payment/checkout-session/:sessionId - Retrieves session details
POST   /payment/webhook                     - Handles Stripe webhooks
POST   /payment/activate-plan               - Legacy endpoint
```

#### 3. Cron Job (server.js)
Runs **every minute** to:
- Find expired plans (where `planExpiration < now`)
- Reset expired users' plans to "free"
- Update `planStatus` to "expired"
- Only processes non-free plans

```javascript
cron.schedule("* * * * *", async () => {
  // Reset expired plans to free
})
```

### Pricing Plans Configuration

| Plan | Price | Duration | Benefits |
|------|-------|----------|----------|
| Free | $0 | Unlimited | Basic features, Limited access |
| Silver | $9.99 | 1 Hour | Priority support, Advanced tools |
| Gold | $19.99 | 6 Hours | Premium tools, 24/7 support |

**Note**: Update `STRIPE_PRICE_ID_SILVER` and `STRIPE_PRICE_ID_GOLD` in `.env` with actual Stripe product price IDs.

### User Model Updates
```javascript
plan: String (enum: ["free", "silver", "gold"]) // Current plan
planExpiration: Date // When the plan expires
planStatus: String (enum: ["active", "expired"]) // Plan status
```

### Frontend Components

#### 1. Payment Page (`frontend/src/pages/Payment.jsx`)
- Displays three pricing plan cards
- Fetches user's current plan status
- Handles plan activation:
  - **Free Plan**: Direct API call, no Stripe required
  - **Paid Plans**: Redirects to Stripe Checkout
- Shows remaining time for active plans
- Updates status every 30 seconds

#### 2. Payment Success Page (`frontend/src/pages/PaymentSuccess.jsx`)
- Verifies checkout session completion
- Displays successful payment message
- Redirects to payment page after 3 seconds
- Handles payment processing delays

#### 3. Payment Cancel Page (`frontend/src/pages/PaymentCancel.jsx`)
- Shows cancellation message
- Allows users to retry payment or go home

#### 4. Admin Panel Updates
- Displays user's plan, status, and expiration time
- Shows countdown timer for active plans
- Allows manual plan editing
- Filters users by plan and status

## Security Features

1. **Webhook Signature Verification**: All webhook events are verified using Stripe secret
2. **Server-side Validation**: Plans are verified on backend before processing
3. **User Authentication**: All payment endpoints require authenticated user
4. **Raw Body Capture**: Webhook handler captures raw body for signature verification
5. **Metadata Tracking**: User ID and plan ID stored in Stripe metadata for audit trail

## Environment Variables Required

```bash
# Stripe Keys (from .env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product Price IDs (to be set)
STRIPE_PRICE_ID_SILVER=price_...
STRIPE_PRICE_ID_GOLD=price_...

# Base URL for redirect URLs
BASE_URL=http://localhost:5000
```

## Stripe Setup Instructions

### 1. Create Products and Prices in Stripe Dashboard
- Navigate to Products → Add Product
- Create "Silver Plan" product
  - Price: $9.99
  - Save Price ID as `STRIPE_PRICE_ID_SILVER`
- Create "Gold Plan" product
  - Price: $19.99
  - Save Price ID as `STRIPE_PRICE_ID_GOLD`

### 2. Set Up Webhook
- Go to Webhooks → Add Endpoint
- Endpoint URL: `https://yourdomain.com/payment/webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `charge.refunded`
- Copy Webhook Secret as `STRIPE_WEBHOOK_SECRET`

## Payment Flow

### User Perspective
1. User navigates to `/payment` page
2. Selects Silver or Gold plan
3. Clicks "Buy" button
4. Redirected to Stripe Checkout
5. Enters payment details
6. Stripe processes payment
7. Redirected to success page with plan activated
8. Plan automatically expires after duration (1h or 6h)
9. Admin can see plan status in dashboard

### Backend Flow
1. **Create Checkout Session**
   - Frontend requests checkout session with userId and planId
   - Backend validates user and plan
   - Stripe creates session, returns sessionId
   
2. **Payment Processing**
   - User completes payment in Stripe Checkout
   - Stripe returns to success URL with sessionId
   
3. **Webhook Verification**
   - Stripe sends payment completion webhook
   - Backend verifies webhook signature
   - Updates user's plan and expiration time
   
4. **Plan Expiration**
   - Cron job runs every minute
   - Identifies expired plans
   - Resets to "free" and marks as "expired"

## API Endpoints

### Create Checkout Session
```
POST /payment/create-checkout-session
Body: { userId, planId }
Response: { success, sessionId, publishableKey }
```

### Activate Free Plan
```
POST /payment/activate-free
Body: { userId }
Response: { success, user }
```

### Get Plan Status
```
GET /payment/plan-status/:userId
Response: { plan, status, expiration, remainingTime, isExpired }
```

### Get Available Plans
```
GET /payment/plans
Response: { success, plans, publishableKey }
```

### Handle Webhook
```
POST /payment/webhook
Headers: Stripe-Signature
Body: Stripe event JSON
```

## Testing

### Test Mode
- Use Stripe's test card numbers:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
- Test webhook events locally using:
  - Stripe CLI: `stripe listen --forward-to localhost:5000/payment/webhook`

### Manual Testing Steps
1. Login to application
2. Navigate to `/payment`
3. Select Silver plan
4. Click "Buy - $9.99"
5. Use test card `4242 4242 4242 4242`
6. Verify plan activation and expiration time
7. Check admin panel to see plan status
8. Wait for cron job or manually test plan expiration

## Known Limitations

1. **Test Mode Only**: Current setup uses Stripe test keys
2. **Single Currency**: Default USD, would need modification for other currencies
3. **No Renewal**: Plans don't auto-renew; user must repurchase
4. **No Cancellation**: No mid-plan cancellation/refund logic implemented

## Future Enhancements

1. Add recurring billing for subscriptions
2. Implement plan cancellation and refunds
3. Add payment history and receipts
4. Support multiple currencies
5. Add coupon/discount code support
6. Implement dunning for failed payments
7. Add analytics and revenue tracking
8. Support multiple payment methods (PayPal, Apple Pay, etc.)

## Troubleshooting

### Payment not processing
- Verify Stripe keys are correct in `.env`
- Check Stripe webhook is properly configured
- Review browser console and server logs for errors

### Plan not updating
- Ensure webhook signature verification passes
- Check Stripe webhook events in dashboard
- Verify userId and planId are correctly passed

### Cron job not running
- Ensure node-cron is installed: `npm list node-cron`
- Check server logs for cron job execution
- Verify MongoDB connection is active

### Frontend Stripe errors
- Verify Stripe publishable key is correct
- Check CORS settings allow Stripe domain
- Ensure @stripe/js package is installed

## Files Modified/Created

### Created:
- `backend/controllers/paymentController.js` - Payment logic
- `frontend/src/pages/PaymentSuccess.jsx` - Success page
- `frontend/src/pages/PaymentCancel.jsx` - Cancel page

### Modified:
- `backend/routes/paymentRoutes.js` - Updated with new endpoints
- `backend/server.js` - Added webhook raw body handling and cron fixes
- `frontend/src/pages/Payment.jsx` - Integrated Stripe checkout
- `frontend/src/App.jsx` - Added new routes for success/cancel
- `backend/models/user.js` - Already had plan fields (no changes needed)
- `frontend/src/pages/Admin.jsx` - Already displays plan info (no changes needed)

## Conclusion

This implementation provides a complete, secure payment gateway integration with time-limited pricing plans. The system automatically manages plan expiration, displays real-time status to users and admins, and integrates with Stripe for secure payment processing.
