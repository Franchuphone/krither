"use client";

import { Loader2Icon, type LucideIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { parseEther, type Abi } from "viem";
import { useTrackedWrite } from "@/hooks/useTrackedWrite";
import { Button } from "@/components/ui/button";
import CardHeading from "@/components/cards/CardHeading";
import ContractFieldInput from "@/components/cards/ContractFieldInput";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	emptyValues,
	isFieldValid,
	toArgument,
	type ContractField,
} from "@/lib/contractFields";
import { cn } from "@/lib/utils";

type WriteCallCardProps = {
	address: `0x${string}`;
	abi: Abi;
	functionName: string;
	title: string;
	description: string;
	icon: LucideIcon;
	/** Omit for a no-argument call such as pause(). */
	fields?: readonly ContractField[];
	submitLabel: string;
	successMessage: string;
	/** Moves value out of Krither: colours the card as destructive. */
	danger?: boolean;
	disable?: boolean;
	validate?: (values: Record<string, string>) => string | null;
};

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
	disable,
	validate,
}: WriteCallCardProps) => {
	const [values, setValues] = useState<Record<string, string>>(() =>
		emptyValues(fields),
	);

	const invalidInput = fields.some(
		(field) => !isFieldValid(field, values[field.name] ?? ""),
	);

	const blocked = invalidInput ? null : (validate?.(values) ?? null);

	const { write: writeContract, busy } = useTrackedWrite({
		toastId: `write-${functionName}`,
		pendingMessage: "Transaction en cours de traitement",
		successMessage,
		// Clears the form only once the write is confirmed on chain.
		onConfirmed: useCallback(async () => {
			setValues(emptyValues(fields));
		}, [fields]),
	});

	const submit = () => {
		const args = fields
			.filter((field) => !field.asValue)
			.map((field) => toArgument(field, values[field.name] ?? ""));

		const valueField = fields.find((field) => field.asValue);
		const value =
			valueField ?
				parseEther((values[valueField.name] ?? "0").trim())
			:	undefined;

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
			<CardHeading
				icon={Icon}
				title={title}
				description={description}
				tone={danger ? "destructive" : "primary"}
			/>

			{fields.length > 0 && (
				<CardContent className="grid gap-3 sm:grid-cols-2">
					{fields.map((field) => (
						<ContractFieldInput
							key={field.name}
							field={field}
							id={`${functionName}-${field.name}`}
							value={values[field.name] ?? ""}
							onChange={(next) =>
								setValues((current) => ({
									...current,
									[field.name]: next,
								}))
							}
							disabled={busy}
						/>
					))}
				</CardContent>
			)}

			<CardFooter className="justify-end gap-3">
				{blocked && (
					<p className="mr-auto text-xs text-destructive">{blocked}</p>
				)}
				<Button
					variant={danger ? "destructive" : "default"}
					aria-label={submitLabel}
					disabled={busy || invalidInput || disable || !!blocked}
					onClick={submit}
				>
					{busy ?
						<Loader2Icon className="animate-spin" />
					:	submitLabel}
				</Button>
			</CardFooter>
		</Card>
	);
};

export default WriteCallCard;
