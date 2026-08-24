"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LotRefForm = ({ producerId }: { producerId: string }) => {
	const [ref, setRef] = useState("");
	const [pending, setPending] = useState(false);
	const router = useRouter();

	const valid = /^\d+$/.test(ref);

	const search = () => {
		if (!valid) return;

		setPending(true);
		router.push(`/verify/${producerId}/${ref}`);
	};

	return (
		<form action={search} className="flex flex-col gap-2">
			<Label htmlFor="lot-ref" className="text-sm">
				Numéro de lot
			</Label>

			<div className="flex items-start gap-2">
				<div className="flex flex-1 flex-col gap-1.5">
					<Input
						id="lot-ref"
						name="ref"
						inputMode="numeric"
						autoComplete="off"
						placeholder="Ex. 240815"
						value={ref}
						aria-invalid={ref !== "" && !valid}
						aria-describedby="lot-ref-hint"
						onChange={(event) =>
							setRef(event.target.value.trim())
						}
						className="h-8"
					/>
					<span
						id="lot-ref-hint"
						className="text-xs text-muted-foreground"
					>
						{ref !== "" && !valid ?
							"Le numéro de lot ne contient que des chiffres."
						:	"Il figure sur l'étiquette ou l'emballage du produit."}
					</span>
				</div>

				<Button
					type="submit"
					size="lg"
					disabled={!valid || pending}
					className="shrink-0"
				>
					<SearchIcon data-icon="inline-start" />
					Vérifier
				</Button>
			</div>
		</form>
	);
};

export default LotRefForm;
