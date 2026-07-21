"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConnection } from "wagmi";

/**
 * Root wallet gate.
 *
 * Adapted from the voting-dapp pattern: there, "/" is itself the connect wall.
 * In Krither the home route "/" is a PUBLIC marketing landing (the scroll
 * homepage) that everyone should see, so this guard leaves "/" open and instead
 * gates every OTHER route — a disconnected user hitting an app route (e.g.
 * /dashboard) is bounced back to "/". Pages below "/" can assume a connected
 * wallet.
 */
export default function ConnectionGuard({ children }: { children: ReactNode }) {
  const { isConnected } = useConnection();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = pathname === "/";

  // Connection state is client-only; wait for mount to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isConnected && !isPublic) {
      router.replace("/");
    }
  }, [mounted, isConnected, isPublic, router]);

  if (!mounted) return null;

  // Gated routes render nothing while disconnected (redirect is in flight).
  if (!isConnected && !isPublic) return null;

  return <>{children}</>;
}
