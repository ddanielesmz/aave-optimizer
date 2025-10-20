"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import config from "@/config";

const RainbowProviders = dynamic(() => import("@/components/RainbowProviders"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <span
        className="loading loading-spinner text-primary"
        aria-label="Loading wallet providers"
      />
    </div>
  ),
});

const WALLET_PROVIDER_ROUTES = [/^\/dashboard(\/.*)?$/];

// Crisp customer chat support:
// This component is separated from ClientLayout because it needs to be wrapped with <SessionProvider> to use useSession() hook
const CrispChat = () => {
  const pathname = usePathname();
  const { data } = useSession();
  const [crisp, setCrisp] = useState(null);
  const isConfiguredRef = useRef(false);
  const hideListenerAttachedRef = useRef(false);

  useEffect(() => {
    let canceled = false;

    async function loadCrisp() {
      if (!config?.crisp?.id || isConfiguredRef.current) {
        return;
      }

      try {
        const crispModule = await import("crisp-sdk-web");
        if (canceled) return;

        crispModule.Crisp.configure(config.crisp.id);
        isConfiguredRef.current = true;
        setCrisp(crispModule.Crisp);
      } catch (error) {
        console.error("[Crisp] Failed to initialize chat widget", error);
      }
    }

    loadCrisp();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!crisp || !config?.crisp?.id) {
      return;
    }

    const shouldHide =
      Array.isArray(config.crisp.onlyShowOnRoutes) &&
      !config.crisp.onlyShowOnRoutes.includes(pathname);

    if (shouldHide) {
      crisp.chat.hide();
      if (!hideListenerAttachedRef.current) {
        hideListenerAttachedRef.current = true;
        crisp.chat.onChatClosed(() => {
          crisp.chat.hide();
        });
      }
    } else {
      crisp.chat.show();
    }
  }, [crisp, pathname]);

  // Add User Unique ID to Crisp to easily identify users when reaching support (optional)
  useEffect(() => {
    if (data?.user && config?.crisp?.id && crisp) {
      crisp.session.setData({ userId: data.user.id });
    }
  }, [crisp, data]);

  return null;
};

// All the client wrappers are here (they can't be in server components)
// 1. SessionProvider: Allow the useSession from next-auth (find out if user is auth or not)
// 2. NextTopLoader: Show a progress bar at the top when navigating between pages
// 3. Toaster: Show Success/Error messages anywhere from the app with toast()
// 4. Tooltip: Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content=""
// 5. CrispChat: Set Crisp customer chat support (see above)
const LayoutShell = ({ children }) => {
  return (
    <>
      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {/* Content inside app/page.js files  */}
      {children}

      {/* Show Success/Error messages anywhere from the app with toast() */}
      <Toaster
        toastOptions={{
          duration: 3000,
        }}
      />

      {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
      <Tooltip
        id="tooltip"
        className="z-[60] !opacity-100 max-w-sm shadow-lg"
      />

      {/* Set Crisp customer chat support */}
      <CrispChat />
    </>
  );
};

const ClientLayout = ({ children }) => {
  const pathname = usePathname();

  const needsWalletProviders = useMemo(() => {
    if (!pathname) {
      return false;
    }
    return WALLET_PROVIDER_ROUTES.some((matcher) => matcher.test(pathname));
  }, [pathname]);

  return (
    <SessionProvider>
      {needsWalletProviders ? (
        <RainbowProviders>
          <LayoutShell>{children}</LayoutShell>
        </RainbowProviders>
      ) : (
        <LayoutShell>{children}</LayoutShell>
      )}
    </SessionProvider>
  );
};

export default ClientLayout;
