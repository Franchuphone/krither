"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createSiweMessage } from "viem/siwe";
import { useConnection, useSignMessage } from "wagmi";
import { sepolia } from "wagmi/chains";
import {
	completeAdminSignIn,
	currentAdminAddress,
	startAdminSignIn,
} from "@/app/actions/admin/session";

export function useAdminSession() {
	const { address } = useConnection();
	const { mutateAsync: signMessage } = useSignMessage();
	const queryClient = useQueryClient();

	const { data: sessionAddress, isPending } = useQuery({
		queryKey: ["admin-session"],
		queryFn: currentAdminAddress,
	});

	const signIn = useMutation({
		mutationFn: async () => {
			if (!address) throw new Error("Aucun compte connecté");

			const { nonce, domain } = await startAdminSignIn();

			const message = createSiweMessage({
				address,
				chainId: sepolia.id,
				domain,
				nonce,
				uri: window.location.origin,
				version: "1",
				statement:
					"Signez pour ouvrir une session d'administration Krither.",
			});

			const signature = await signMessage({ message });
			const state = await completeAdminSignIn(message, signature);
			if (state.error) throw new Error(state.error);
		},
		onSuccess: () => queryClient.invalidateQueries(),
		onError: (error) => toast.error(error.message),
	});

	// A session signed by another wallet must not survive an account switch.
	const active =
		!!sessionAddress &&
		!!address &&
		sessionAddress.toLowerCase() === address.toLowerCase();

	return {
		active,
		isPending,
		signIn: signIn.mutate,
		signingIn: signIn.isPending,
	};
}
