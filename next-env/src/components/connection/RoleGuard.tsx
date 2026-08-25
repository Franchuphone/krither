"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useConnection, useReadContract } from "wagmi";
import LoadingAlert from "@/components/nav/LoadingAlert";
import { paymasterAddress } from "@/lib/paymaster";
import { registryABI, registryAddress } from "@/lib/registry";
import {
	DEFAULT_ADMIN_ROLE,
	PAUSER_ROLE,
	PAYMASTER_ROLE,
	PRODUCER_ROLE,
} from "@/lib/roles";

export type RolesContext = {
	hasRole?: boolean;
	isAdmin?: boolean;
	isProducer?: boolean;
	isPauser?: boolean;
	isPaymaster?: boolean;
};

const RolesContext = createContext<RolesContext | null>(null);

export function useRolesContext() {
	const role = useContext(RolesContext);
	if (!role)
		throw new Error(
			"useRolesContext must be used inside a RoleGuard route",
		);
	return role;
}

const RoleGuard = ({ children }: { children: ReactNode }) => {
	const { address: connected } = useConnection();

	if (!registryAddress || !paymasterAddress) {
		throw new Error(
			"Missing registry or paymaster address in environment variables",
		);
	}

	const { data: isAdmin, isLoading: adminLoading } = useReadContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "hasRole",
		args: [DEFAULT_ADMIN_ROLE, connected as `0x${string}`],
		query: { enabled: !!registryAddress && !!connected },
	});

	const { data: isProducer, isLoading: producerLoading } = useReadContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "hasRole",
		args: [PRODUCER_ROLE, connected as `0x${string}`],
		query: { enabled: !!registryAddress && !!connected },
	});

	const { data: isPauser, isLoading: pauserLoading } = useReadContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "hasRole",
		args: [PAUSER_ROLE, connected as `0x${string}`],
		query: { enabled: !!registryAddress && !!connected },
	});

	const { data: isPaymaster, isLoading: paymasterLoading } = useReadContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "hasRole",
		args: [PAYMASTER_ROLE, connected as `0x${string}`],
		query: { enabled: !!registryAddress && !!connected },
	});

	const hasRole = isAdmin || isProducer || isPauser || isPaymaster;
	const isResolving =
		!connected ||
		adminLoading ||
		producerLoading ||
		pauserLoading ||
		paymasterLoading;

	if (isResolving) {
		return <LoadingAlert text="Vérification des accès…" />;
	}

	return (
		<RolesContext.Provider
			value={{
				hasRole,
				isAdmin,
				isProducer,
				isPauser,
				isPaymaster,
			}}
		>
			{children}
		</RolesContext.Provider>
	);
};

export default RoleGuard;
