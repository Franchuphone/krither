"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useReadContract } from "wagmi";
import LoadingAlert from "@/components/reusable/LoadingAlert";
import { registryABI } from "@/lib/registry";
import { DEFAULT_ADMIN_ROLE } from "@/lib/roles";

type RegistryContext = {
	registryAddress: `0x${string}`;
	isAdmin: boolean;
	adminLoading: boolean;
};

const RegistryContext = createContext<RegistryContext | null>(null);

export function useRegistryContext() {
	const role = useContext(RegistryContext);
	if (!role)
		throw new Error(
			"useRegistryContext must be used inside a RoleGuard route",
		);
	return role;
}

export default function RoleGuard({ children }: { children: ReactNode }) {
	const { address: connected } = useConnection();
	const router = useRouter();

	const registryAddress = process.env
		.NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS as `0x${string}` | undefined;

	const { data: isAdmin, isLoading: adminLoading } = useReadContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "hasRole",
		args: [DEFAULT_ADMIN_ROLE, connected as `0x${string}`],
		query: { enabled: !!registryAddress && !!connected },
	});

	// const { data: owner, isLoading: ownerLoading } = useReadContract({
	// 	address: registryAddress,
	// 	abi: registryABI,
	// 	functionName: "owner",
	// 	query: { enabled: !!registryAddress },
	// });

	// const { isSuccess: isVoter, isLoading: voterLoading } = useReadContract({
	// 	address: registryAddress,
	// 	abi: registryABI,
	// 	functionName: "getVoter",
	// 	args: [connected as `0x${string}`],
	// 	account: connected,
	// 	query: { enabled: !!registryAddress && !!connected, retry: false },
	// });

	const hasRole = isAdmin;
	const isResolving = !connected || adminLoading;

	useEffect(() => {
		if (!isResolving && !hasRole) {
			router.replace("/dashboard/unregistered");
		}
	}, [connected, isResolving, hasRole, router]);

	if (isResolving) {
		return <LoadingAlert text="Checking access…" />;
	}

	// Reaching here means reads succeeded, so registryAddress is defined.
	if (!hasRole || !registryAddress) return null;

	return (
		<RegistryContext.Provider
			value={{ registryAddress, isAdmin, adminLoading }}
		>
			{children}
		</RegistryContext.Provider>
	);
}
