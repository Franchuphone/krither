"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConnection } from "wagmi";
import NotConnectedHome from "@/components/connection/NotConnectedHome";

/**
 * Root wallet gate.
 *
 * this guard leaves "/" open and instead gates every OTHER protected route
 * A disconnected user hitting an app protected route is bounced back to "/".
 */
export default function ConnectionGuard({ children }: { children: ReactNode }) {
	const { isConnected } = useConnection();
	const router = useRouter();
	const pathname = usePathname();
	const isHome = pathname === "/";
	const isPublic = isHome || pathname.startsWith("/verify/");

	// Connection state is client-only; wait for mount to avoid a hydration mismatch.
	const [mounted, setMounted] = useState(false);
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (mounted && !isConnected && !isPublic) {
			router.replace("/");
		}
		if (isConnected && isHome) {
			router.replace("/dashboard");
		}
	}, [mounted, isConnected, isHome, isPublic, router]);

	if (isPublic && !isHome) return <>{children}</>;

	if (!mounted) return null;

	if (!isConnected) {
		if (isHome) return <NotConnectedHome />;
		if (!isPublic) return null;
	}

	return <>{children}</>;
}
