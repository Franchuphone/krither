"use client";

import { BadgePlus, SlidersHorizontal } from "lucide-react";
import WriteCallCard from "@/components/cards/WriteCallCard";
import { roleField } from "@/lib/contractFields";
import { paymasterABI, paymasterAddress } from "@/lib/paymaster";
import { USER_ROLE_OPTIONS } from "@/lib/roles";

const Plans = () => (
	<div className="flex w-full max-w-3xl flex-col gap-3 text-left">
		<WriteCallCard
			address={paymasterAddress}
			abi={paymasterABI}
			functionName="addPlan"
			title="Créer une formule"
			description="Crée une formule de sponsoring pour un statut. Le quota correspond au nombre d'opérations par période"
			icon={BadgePlus}
			fields={[
				roleField(USER_ROLE_OPTIONS),
				{
					name: "price",
					label: "Prix (ETH)",
					type: "ether",
					placeholder: "0.01",
				},
				{
					name: "quota",
					label: "Quota (opérations)",
					type: "uint",
					placeholder: "100",
				},
				{
					name: "period",
					label: "Période (jours)",
					type: "days",
					placeholder: "30",
				},
			]}
			submitLabel="Créer la formule"
			successMessage="Formule créée"
		/>
		<WriteCallCard
			address={paymasterAddress}
			abi={paymasterABI}
			functionName="setPlan"
			title="Modifier une formule"
			description="Change le tarif d'une formule existante ou la retire de la vente"
			icon={SlidersHorizontal}
			fields={[
				{
					name: "planId",
					label: "Identifiant de formule",
					type: "uint",
					placeholder: "0",
				},
				{
					name: "price",
					label: "Prix (ETH)",
					type: "ether",
					placeholder: "0.01",
				},
				{
					name: "quota",
					label: "Quota (opérations)",
					type: "uint",
					placeholder: "100",
				},
				{
					name: "period",
					label: "Période (jours)",
					type: "days",
					placeholder: "30",
				},
				{ name: "enabled", label: "En vente", type: "bool" },
			]}
			submitLabel="Modifier la formule"
			successMessage="Formule modifiée"
		/>
	</div>
);

export default Plans;
