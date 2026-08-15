"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConnection } from "wagmi";
import NotConnectedHome from "@/components/connection/NotConnectedHome";

/**
 * Root wallet gate.
 *
 * this guard leaves "/" open and instead
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
		if (isConnected && isPublic) {
			router.replace("/dashboard");
		}
	}, [mounted, isConnected, isPublic, router]);

	if (!mounted) return null;

	if (!isConnected) {
		return isPublic ? <NotConnectedHome /> : null;
	}

	return <>{children}</>;
}
