"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseEther, type Abi } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Solidity shape of a field. The type drives validation and how the raw input
 * is coerced into an argument; `options` only decides whether the control is a
 * select or a free input, so an option's value must still be valid for its type.
 * `ether` is typed in ETH and converted to wei, so no one has to count zeroes.
 */
export type WriteFieldType =
	| "address"
	| "uint"
	| "uint[]"
	| "bytes32"
	| "string"
	| "bool"
	| "ether";

export type WriteField = {
	name: string;
	label: string;
	type: WriteFieldType;
	placeholder?: string;
	options?: readonly { value: string; label: string }[];
	/** Sends the field as the transaction value rather than an argument, which
	 *  is what a payable call needs. Only meaningful on an `ether` field. */
	asValue?: boolean;
};

type WriteCallCardProps = {
	address: `0x${string}`;
	abi: Abi;
	functionName: string;
	title: string;
	description: string;
	icon: LucideIcon;
	/** Omit for a no-argument call such as pause(). */
	fields?: readonly WriteField[];
	submitLabel: string;
	successMessage: string;
	/** Moves value out of Krither: colours the card as destructive. */
	danger?: boolean;
	disabled?: boolean;
};

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const UINT = /^\d+$/;
const UINT_LIST = /^\d+(\s*,\s*\d+)*$/;
const BYTES32 = /^0x[0-9a-fA-F]{64}$/;
const DECIMAL = /^\d+(\.\d+)?$/;

function isFieldValid(field: WriteField, raw: string) {
	const value = raw.trim();
	if (field.type === "bool") return true;
	if (!value) return false;

	switch (field.type) {
		case "address":
			return ADDRESS.test(value);
		case "uint":
			return UINT.test(value);
		case "uint[]":
			return UINT_LIST.test(value);
		case "bytes32":
			return BYTES32.test(value);
		case "ether":
			return DECIMAL.test(value);
		case "string":
			return true;
	}
}

function toArgument(field: WriteField, raw: string) {
	const value = raw.trim();

	switch (field.type) {
		case "address":
		case "bytes32":
			return value as `0x${string}`;
		case "uint":
			return BigInt(value);
		case "uint[]":
			return value.split(",").map((item) => BigInt(item.trim()));
		case "ether":
			return parseEther(value);
		case "bool":
			return value === "true";
		default:
			return value;
	}
}

function emptyValues(fields: readonly WriteField[]) {
	return Object.fromEntries(
		fields.map((field) => [field.name, field.type === "bool" ? "false" : ""]),
	);
}

const WriteCallCard = ({
	address,
	abi,
	functionName,
	title,
	description,
	icon: Icon,
	fields = [],
	submitLabel,
	successMessage,
	danger,
	disabled,
}: WriteCallCardProps) => {
	const {
		mutate: writeContract,
		data: writeData,
		isPending,
		error: writeError,
	} = useWriteContract();

	const queryClient = useQueryClient();
	const [values, setValues] = useState<Record<string, string>>(() =>
		emptyValues(fields),
	);

	const invalidInput = fields.some(
		(field) => !isFieldValid(field, values[field.name] ?? ""),
	);

	const {
		isLoading: isConfirming,
		isSuccess,
		error,
		status,
	} = useWaitForTransactionReceipt({ hash: writeData });

	useEffect(() => {
		if (!writeData) return;
		if (isConfirming) {
			toast.loading("Transaction is being processed", { id: writeData });
		} else if (isSuccess && status === "success") {
			toast.success(successMessage, { id: writeData });
			// Reset the form after a confirmed write (reaction to the tx event).
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setValues(emptyValues(fields));
			// Refetch all reads so the UI reflects the new on-chain state.
			queryClient.invalidateQueries();
		} else if (error) {
			toast.error(error.message ?? "Transaction aborted", { id: writeData });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [writeData, isConfirming, isSuccess, error, status]);

	// Handle a tx reverted before it was ever sent.
	useEffect(() => {
		if (writeError) {
			toast.error(
				"shortMessage" in writeError
					? writeError.shortMessage
					: writeError.message,
				{ id: `write-error-${functionName}` },
			);
		}
	}, [writeError, functionName]);

	const busy = isPending || isConfirming;

	const submit = () => {
		const args = fields
			.filter((field) => !field.asValue)
			.map((field) => toArgument(field, values[field.name] ?? ""));

		const valueField = fields.find((field) => field.asValue);
		const value = valueField
			? parseEther((values[valueField.name] ?? "0").trim())
			: undefined;

		writeContract({
			address,
			abi,
			functionName,
			args,
			value,
		} as never);
	};

	return (
		<Card
			className={cn(
				"w-full gap-4 transition-colors",
				danger ? "ring-destructive/25" : "hover:ring-primary/30",
			)}
		>
			<CardHeader className="flex flex-row items-start gap-3">
				<span
					className={cn(
						"flex size-9 shrink-0 items-center justify-center rounded-md",
						danger
							? "bg-destructive/10 text-destructive"
							: "bg-primary/10 text-primary",
					)}
				>
					<Icon className="size-4.5" />
				</span>
				<span className="flex flex-col gap-1">
					<CardTitle className="text-base">{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</span>
			</CardHeader>

			{fields.length > 0 && (
				<CardContent className="grid gap-3 sm:grid-cols-2">
					{fields.map((field) => {
						const id = `${functionName}-${field.name}`;
						const raw = values[field.name] ?? "";
						const setValue = (next: string) =>
							setValues((current) => ({ ...current, [field.name]: next }));

						return (
							<div
								key={field.name}
								className={cn(
									"flex flex-col gap-1.5",
									field.type === "string" && "sm:col-span-2",
								)}
							>
								<Label htmlFor={id} className="text-muted-foreground">
									{field.label}
								</Label>

								{field.type === "bool" ? (
									<Switch
										id={id}
										checked={raw === "true"}
										onCheckedChange={(checked) =>
											setValue(checked ? "true" : "false")
										}
										disabled={disabled || busy}
										className="mt-1.5"
									/>
								) : field.options ? (
									<Select
										// null, not "", is what makes the placeholder show.
										value={raw === "" ? null : raw}
										onValueChange={(next) => setValue(String(next ?? ""))}
										disabled={disabled || busy}
									>
										<SelectTrigger id={id} className="w-full">
											<SelectValue placeholder={field.placeholder ?? "Select"} />
										</SelectTrigger>
										<SelectContent>
											{field.options.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<Input
										id={id}
										value={raw}
										onChange={(event) => setValue(event.target.value)}
										placeholder={field.placeholder}
										disabled={disabled || busy}
										aria-invalid={
											raw.length > 0 && !isFieldValid(field, raw)
										}
										spellCheck={false}
									/>
								)}

								{field.type === "ether" && isFieldValid(field, raw) && (
									<p className="text-xs text-muted-foreground tabular-nums">
										{parseEther(raw.trim()).toString()} wei
									</p>
								)}
							</div>
						);
					})}
				</CardContent>
			)}

			<CardFooter className="justify-end">
				<Button
					variant={danger ? "destructive" : "default"}
					aria-label={submitLabel}
					disabled={disabled || busy || invalidInput}
					onClick={submit}
				>
					{busy ? <Loader2Icon className="animate-spin" /> : submitLabel}
				</Button>
			</CardFooter>
		</Card>
	);
};

export default WriteCallCard;
