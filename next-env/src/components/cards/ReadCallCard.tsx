"use client";

import { Loader2Icon, RotateCwIcon, type LucideIcon } from "lucide-react";
import { useState } from "react";
import type { Abi, AbiFunction, AbiParameter } from "viem";
import { useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import CardHeading from "@/components/cards/CardHeading";
import ContractFieldInput from "@/components/cards/ContractFieldInput";
import { Card, CardContent } from "@/components/ui/card";
import {
	emptyValues,
	isFieldValid,
	toArgument,
	type ContractField,
} from "@/lib/contractFields";

type ReadCallCardProps = {
	address: `0x${string}`;
	abi: Abi;
	functionName: string;
	title: string;
	description: string;
	icon: LucideIcon;
	/** Omit for a no-argument call such as planCount(). */
	fields?: readonly ContractField[];
};

function outputsOf(abi: Abi, functionName: string): readonly AbiParameter[] {
	const entry = abi.find(
		(item): item is AbiFunction =>
			item.type === "function" && item.name === functionName,
	);
	return entry?.outputs ?? [];
}

function formatValue(value: unknown): string {
	if (value === null || value === undefined) return "-";
	if (typeof value === "bigint") return value.toString();
	if (typeof value === "boolean") return value ? "Oui" : "Non";
	if (Array.isArray(value))
		return value.length ? value.map(formatValue).join(", ") : "vide";
	if (typeof value === "object") return JSON.stringify(value, replaceBigInt);
	return String(value);
}

function replaceBigInt(_key: string, value: unknown) {
	return typeof value === "bigint" ? value.toString() : value;
}

const ReadCallCard = ({
	address,
	abi,
	functionName,
	title,
	description,
	icon: Icon,
	fields = [],
}: ReadCallCardProps) => {
	const [values, setValues] = useState<Record<string, string>>(() =>
		emptyValues(fields),
	);

	const invalidInput = fields.some(
		(field) => !isFieldValid(field, values[field.name] ?? ""),
	);

	const args =
		invalidInput ?
			[]
		:	fields.map((field) => toArgument(field, values[field.name] ?? ""));

	const { data, error, isFetching, refetch } = useReadContract({
		address,
		abi,
		functionName,
		args,
		query: { enabled: !invalidInput },
	} as never);

	const readError = error as
		| { shortMessage?: string; message?: string }
		| null
		| undefined;

	const outputs = outputsOf(abi, functionName);
	// viem returns an array only when the function declares several outputs, so
	// a lone uint256[] output must not be spread across rows.
	const returned =
		outputs.length > 1 ? (data as readonly unknown[] | undefined) : [data];

	return (
		<Card className="w-full gap-4 transition-colors hover:ring-primary/30">
			<CardHeading
				icon={Icon}
				title={title}
				description={description}
				action={
					<Button
						variant="ghost"
						size="icon"
						aria-label="Rafraîchir"
						disabled={invalidInput || isFetching}
						onClick={() => refetch()}
					>
						{isFetching ?
							<Loader2Icon className="animate-spin" />
						:	<RotateCwIcon />}
					</Button>
				}
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
						/>
					))}
				</CardContent>
			)}

			<CardContent>
				{invalidInput ?
					<p className="text-sm text-muted-foreground">
						Renseignez les champs pour activer la lecture
					</p>
				: readError ?
					<p className="text-sm wrap-break-word text-destructive">
						{readError.shortMessage ??
							readError.message ??
							"Lecture impossible"}
					</p>
				: data === undefined ?
					<p className="text-sm text-muted-foreground">
						Lecture en cours…
					</p>
				:	<dl>
						{outputs.map((output, index) => {
							const value = returned?.[index];
							const label = output.name || undefined;

							return (
								<div
									key={`${label}-${index}`}
									className="p-2 text-2xl font-bold"
								>
									<dt className="text-sm text-muted-foreground">
										{label}
									</dt>
									<dd className="font-mono text-sm break-all tabular-nums">
										{formatValue(value)}
									</dd>
								</div>
							);
						})}
					</dl>
				}
			</CardContent>
		</Card>
	);
};

export default ReadCallCard;
