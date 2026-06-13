export const routes = {
  public: {
    home: "/",
    privacy: "/privacy"
  },
  tracking: {
    token: (token: string) => `/track/${encodeURIComponent(token)}`
  },
  admin: {
    customerDetails: (customerId: string) => `/admin/customers/${encodeURIComponent(customerId)}`,
    forgotPassword: "/admin/forgot-password",
    home: "/admin",
    login: "/admin/login",
    orderDetails: (orderId: string) => `/admin/orders/${encodeURIComponent(orderId)}`,
    resetPassword: "/admin/reset-password",
    orders: "/admin/orders",
    newOrder: "/admin/orders/new",
    emails: "/admin/emails",
    users: "/admin/users",
    settings: "/admin/settings"
  },
  api: {
    lookup: "/api/tracking/lookup",
    health: "/api/health",
    resendWebhook: "/api/webhooks/resend",
    emailOutboxCron: "/api/cron/process-email-outbox"
  }
} as const;
