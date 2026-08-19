"use client";

import { Loader2Icon, SendIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	submitProducerRequest,
	type SubmitState,
} from "@/app/actions/producers";
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
import {
	EMPTY_SUBMISSION,
	normalizeSubmission,
	REGISTRATION_FIELDS,
	SUPPORTED_COUNTRY,
	validateField,
	type ProducerSubmission,
} from "@/lib/producerRegistration";
import { cn } from "@/lib/utils";

const VALID_STYLE =
	"bg-success/20 dark:bg-success/20 ring-2 ring-success/20 dark:ring-success/40";

const ProducerRegistrationForm = ({
	account,
	onSubmitted,
}: {
	account: `0x${string}`;
	onSubmitted: () => void;
}) => {
	const [values, setValues] = useState<ProducerSubmission>(EMPTY_SUBMISSION);
	const [state, formAction, pending] = useActionState<SubmitState, FormData>(
		submitProducerRequest,
		{},
	);

	useEffect(() => {
		if (state.ok) {
			toast.success("Demande envoyée");
			onSubmitted();
		} else if (state.error) {
			toast.error(state.error);
		}
	}, [state, onSubmitted]);

	const normalized = normalizeSubmission(values);
	const incomplete = REGISTRATION_FIELDS.some((field) =>
		validateField(field.name, normalized),
	);

	return (
		<Card className="w-full gap-4">
			<CardHeader>
				<CardTitle className="text-base">
					Demande d&apos;accès
				</CardTitle>
				<CardDescription>
					Renseignez les informations de votre entreprise. <br /> Un
					administrateur vérifiera le dossier afin de vous permettre
					d&apos;accéder à la plateforme.
				</CardDescription>
			</CardHeader>

			<form action={formAction}>
				<CardContent className="grid gap-3 sm:grid-cols-2">
					<input type="hidden" name="account" value={account} />

					{REGISTRATION_FIELDS.map((field) => {
						const id = `registration-${field.name}`;
						const raw = values[field.name];
						const setValue = (next: string) =>
							setValues((current) => ({
								...current,
								[field.name]: next,
							}));

						const error =
							state.errors?.[field.name] ??
							(raw.length > 0 ?
								validateField(field.name, normalized)
							:	null);

						const valid = raw.length > 0 && !error;

						return (
							<div
								key={field.name}
								className={cn(
									"flex flex-col gap-1.5",
									field.wide && "sm:col-span-2",
								)}
							>
								<Label
									htmlFor={id}
									className="text-muted-foreground"
								>
									{field.label}
								</Label>

								{field.fixed ?
									<>
										<Input
											id={id}
											value="France"
											readOnly
											disabled
										/>
										<input
											type="hidden"
											name={field.name}
											value={SUPPORTED_COUNTRY}
										/>
									</>
								: field.options ?
									<Select
										name={field.name}
										value={raw === "" ? null : raw}
										onValueChange={(next) =>
											setValue(String(next ?? ""))
										}
										disabled={pending}
									>
										<SelectTrigger
											id={id}
											className={cn(
												"w-full",
												valid && VALID_STYLE,
											)}
										>
											<SelectValue
												placeholder={field.placeholder}
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
										name={field.name}
										value={raw}
										onChange={(event) =>
											setValue(event.target.value)
										}
										placeholder={field.placeholder}
										autoComplete={field.autoComplete}
										disabled={pending}
										aria-invalid={!!error}
										className={cn(valid && VALID_STYLE)}
									/>
								}

								{error && (
									<p className="text-xs text-destructive">
										{error}
									</p>
								)}
							</div>
						);
					})}
				</CardContent>

				<CardFooter className="mt-4 justify-end">
					<Button type="submit" disabled={pending || incomplete}>
						{pending ?
							<Loader2Icon className="animate-spin" />
						:	<>
								<SendIcon />
								Envoyer la demande
							</>
						}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
};

export default ProducerRegistrationForm;
