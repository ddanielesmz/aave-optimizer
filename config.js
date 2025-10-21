const config = {
  // REQUIRED
  appName: "Aave Optimizer Dashboard",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Open source DeFi dashboard for optimizing Aave positions, tracking portfolios, analyzing markets, and managing crypto investments.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "aaveoptimizer.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, use it in config.tailwind.js in daisyui.themes.
    theme: "cmyk",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "hsl(var(--p))", // Uses the primary color from the DaisyUI theme dynamically
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