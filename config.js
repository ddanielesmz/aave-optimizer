const config = {
  // REQUIRED
  appName: "Aave Optimizer Dashboard",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Professional DeFi dashboard for optimizing Aave positions, tracking portfolios, analyzing markets, and managing crypto investments.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "aaveoptimizer.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1Niyy5AxyNprDp7iZIqEyD2h"
            : "price_456",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Basic",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Perfect for DeFi beginners",
        // The price you want to display, the one user will be charged on Stripe.
        price: 29,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 49,
        features: [
          {
            name: "Portfolio tracking",
          },
          { name: "Basic analytics" },
          { name: "Aave position monitoring" },
          { name: "Email alerts" },
        ],
      },
      {
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1O5KtcAxyNprDp7iftKnrrpw"
            : "price_456",
        name: "Pro",
        description: "For serious DeFi traders",
        price: 99,
        priceAnchor: 149,
        features: [
          {
            name: "Advanced analytics",
          },
          { name: "Multi-chain support" },
          { name: "Automated strategies" },
          { name: "Priority support" },
          { name: "Custom alerts" },
          { name: "API access" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `Aave Optimizer Dashboard <noreply@aaveoptimizer.com>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Aave Optimizer Dashboard <admin@aaveoptimizer.com>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "support@aaveoptimizer.com",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "cmyk",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "hsl(var(--p))", // Uses the primary color from the DaisyUI theme dynamically
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/api/auth/signin",
    callbackUrl: "/dashboard",
  },
  redis: {
    // Configurazione Redis per cache e code
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    tls: process.env.REDIS_TLS === 'true',
  },
  queue: {
    // Configurazione code BullMQ
    enabled: process.env.QUEUE_ENABLED !== 'false',
    concurrency: {
      health: parseInt(process.env.QUEUE_HEALTH_CONCURRENCY) || 3,
      market: parseInt(process.env.QUEUE_MARKET_CONCURRENCY) || 2,
      positions: parseInt(process.env.QUEUE_POSITIONS_CONCURRENCY) || 5,
      notifications: parseInt(process.env.QUEUE_NOTIFICATIONS_CONCURRENCY) || 10,
    },
    retry: {
      attempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS) || 3,
      delay: parseInt(process.env.QUEUE_RETRY_DELAY) || 2000,
    }
  },
  telegram: {
    // Configurazione Telegram per notifiche alert
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    enabled: !!process.env.TELEGRAM_BOT_TOKEN,
    // Intervallo di controllo alert (in millisecondi)
    checkInterval: parseInt(process.env.ALERT_CHECK_INTERVAL) || 5 * 60 * 1000, // 5 minuti
  },
};

export default config;
