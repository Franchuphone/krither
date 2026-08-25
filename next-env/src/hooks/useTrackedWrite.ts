"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

type TrackedWriteOptions = {
	/** Groups the toasts of one write so they replace each other. */
	toastId: string;
	pendingMessage: string;
	successMessage: string;
	/** Runs once mined, before the success toast. Rejecting reports the error. */
	onConfirmed?: (hash: `0x${string}`) => Promise<void>;
};

const messageOf = (error: { shortMessage?: string; message: string }) =>
	"shortMessage" in error ?
		(error.shortMessage ?? error.message)
	:	error.message;

// A write followed to its receipt, then a full refetch of the cached reads.
export function useTrackedWrite({
	toastId,
	pendingMessage,
	successMessage,
	onConfirmed,
}: TrackedWriteOptions) {
	const queryClient = useQueryClient();
	const {
		mutate: write,
		data: hash,
		isPending: signing,
		error: writeError,
	} = useWriteContract();

	const {
		isLoading: confirming,
		isSuccess,
		error: receiptError,
	} = useWaitForTransactionReceipt({ hash });

	const settled = useRef("");
	const [recording, setRecording] = useState(false);

	useEffect(() => {
		if (confirming) toast.loading(pendingMessage, { id: toastId });
	}, [confirming, pendingMessage, toastId]);

	useEffect(() => {
		const error = writeError ?? receiptError;
		if (error) toast.error(messageOf(error), { id: toastId });
	}, [writeError, receiptError, toastId]);

	useEffect(() => {
		// The effect re-runs on every render; the ref is what makes it run once.
		if (!isSuccess || !hash || settled.current === hash) return;
		settled.current = hash;

		const finish = async () => {
			setRecording(true);
			try {
				await onConfirmed?.(hash);
				toast.success(successMessage, { id: toastId });
				queryClient.invalidateQueries();
			} catch (error) {
				toast.error((error as Error).message, { id: toastId });
			} finally {
				setRecording(false);
			}
		};

		void finish();
	}, [isSuccess, hash, onConfirmed, successMessage, toastId, queryClient]);

	return { write, hash, busy: signing || confirming || recording };
}
