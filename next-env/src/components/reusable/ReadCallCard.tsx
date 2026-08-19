"use client";

import { Loader2Icon, RotateCwIcon, type LucideIcon } from "lucide-react";
import { useState } from "react";
import {
	formatEther,
	type Abi,
	type AbiFunction,
	type AbiParameter,
} from "viem";
import { useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import {
	emptyValues,
	isFieldValid,
	toArgument,
	type ContractField,
} from "@/lib/contractFields";
import { cn } from "@/lib/utils";

export type ReadField = ContractField;

type ReadCallCardProps = {
	address: `0x${string}`;
	abi: Abi;
	functionName: string;
	title: string;
	description: string;
	icon: LucideIcon;
	/** Omit for a no-argument call such as planCount(). */
	fields?: readonly ReadField[];
	/** Renders matching outputs as ETH alongside their wei value. */
	weiOutputs?: readonly string[];
	disabled?: boolean;
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
	weiOutputs = [],
	disabled,
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
		query: { enabled: !disabled && !invalidInput },
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
			<CardHeader className="flex flex-row items-start gap-3">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<Icon className="size-4.5" />
				</span>
				<span className="flex flex-1 flex-col gap-1">
					<CardTitle className="text-base">{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</span>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Rafraîchir"
					disabled={disabled || invalidInput || isFetching}
					onClick={() => refetch()}
				>
					{isFetching ?
						<Loader2Icon className="animate-spin" />
					:	<RotateCwIcon />}
				</Button>
			</CardHeader>

			{fields.length > 0 && (
				<CardContent className="grid gap-3 sm:grid-cols-2">
					{fields.map((field) => {
						const id = `${functionName}-${field.name}`;
						const raw = values[field.name] ?? "";
						const setValue = (next: string) =>
							setValues((current) => ({
								...current,
								[field.name]: next,
							}));

						return (
							<div
								key={field.name}
								className={cn(
									"flex flex-col gap-1.5",
									field.type === "string" && "sm:col-span-2",
								)}
							>
								<Label
									htmlFor={id}
									className="text-muted-foreground"
								>
									{field.label}
								</Label>

								{field.type === "bool" ?
									<Switch
										id={id}
										checked={raw === "true"}
										onCheckedChange={(checked) =>
											setValue(checked ? "true" : "false")
										}
										disabled={disabled}
										className="mt-1.5"
									/>
								: field.options ?
									<Select
										value={raw === "" ? null : raw}
										onValueChange={(next) =>
											setValue(String(next ?? ""))
										}
										disabled={disabled}
									>
										<SelectTrigger
											id={id}
											className="w-full"
										>
											<SelectValue
												placeholder={
													field.placeholder ??
													"Sélectionner"
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{field.options.map((option) => (
												<SelectItem
													key={option.value}
													value={option.value}
												>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								:	<Input
										id={id}
										value={raw}
										onChange={(event) =>
											setValue(event.target.value)
										}
										placeholder={field.placeholder}
										disabled={disabled}
										aria-invalid={
											raw.length > 0 &&
											!isFieldValid(field, raw)
										}
										spellCheck={false}
									/>
								}
							</div>
						);
					})}
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
										{weiOutputs.includes(
											output.name ?? "",
										) &&
											typeof value === "bigint" && (
												<span className="ml-2 text-muted-foreground">
													({formatEther(value)} ETH)
												</span>
											)}
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
