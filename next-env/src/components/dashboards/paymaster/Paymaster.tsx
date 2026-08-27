"use client";

import {
	ArrowLeftRight,
	Bitcoin,
	Euro,
	Fuel,
	Lock,
	LockOpen,
	RotateCcw,
	Target,
} from "lucide-react";
import { useState } from "react";
import { formatEther, parseEther } from "viem";
import WriteCallCard from "@/components/cards/WriteCallCard";
import PillNav, { type PillNavItem } from "@/components/nav/PillNav";
import { usePauseState } from "@/hooks/usePauseState";
import { usePaymasterState } from "@/hooks/usePaymasterState";
import { paymasterABI, paymasterAddress } from "@/lib/paymaster";
import FundingSummary from "./FundingSummary";

const TABS = [
	{ key: "operations", label: "Transactions autorisées", icon: ArrowLeftRight },
	{ key: "funding", label: "Comptes à gérer", icon: Bitcoin },
] as const satisfies readonly PillNavItem[];

const toWei = (raw = "") => {
	try {
		return parseEther(raw.trim() || "0");
	} catch {
		return BigInt(0);
	}
};

const Paymaster = () => {
	const [tab, setTab] = useState<string>("operations");
	const { paymasterPause } = usePauseState();
	const { balance } = usePaymasterState();

	return (
		<div className="flex w-full max-w-3xl flex-col gap-8 text-left">
			<FundingSummary />
			<div className="flex w-full flex-col gap-6">
				<PillNav
					items={TABS}
					activeKey={tab}
					onSelect={setTab}
					label="Votre espace paymaster"
				/>

				{tab === "operations" && (
					<div className="flex flex-col gap-3">
						<WriteCallCard
							address={paymasterAddress}
							abi={paymasterABI}
							functionName="setMaxCostPerOp"
							title="Coût maximum par opération"
							description={
								"Plafonne ce que le paymaster accepte de payer pour une transaction sponsorisée.\nAu-delà, l'opération est refusée"
							}
							icon={Euro}
							fields={[
								{
									name: "newMaxCostPerOp",
									label: "Coût maximum (ETH)",
									type: "ether",
									placeholder: "0.005",
								},
							]}
							submitLabel="Plafonner"
							successMessage="Plafond enregistré"
							disable={paymasterPause}
						/>
						<WriteCallCard
							address={paymasterAddress}
							abi={paymasterABI}
							functionName="resetFreeOps"
							title="Remise à zéro"
							description="Remet à zéro le nombre de transactions sponsorisées offertes à un utilisateur."
							icon={RotateCcw}
							fields={[
								{
									name: "account",
									label: "Wallet du client",
									type: "address",
									placeholder: "0x…",
								},
							]}
							submitLabel="Réinitialiser"
							successMessage="Compteur remis à zéro"
							disable={paymasterPause}
						/>
						<WriteCallCard
							address={paymasterAddress}
							abi={paymasterABI}
							functionName="setSponsoredTarget"
							title="Contrats sponsorisés"
							description="Ajoute ou retire un contrat de la whitelist que le paymaster sponsorise en frais de gas."
							icon={Target}
							fields={[
								{
									name: "target",
									label: "Contrat appelé",
									type: "address",
									placeholder: "0x…",
								},
								{
									name: "allowed",
									label: "Autorisé",
									type: "bool",
								},
							]}
							submitLabel="Enregistrer"
							successMessage="Liste des contrats sponsorisés mise à jour"
							disable={paymasterPause}
							danger
						/>
					</div>
				)}

				{tab === "funding" && (
					<div className="flex flex-col gap-3">
						<WriteCallCard
							address={paymasterAddress}
							abi={paymasterABI}
							functionName="depositToEntryPoint"
							title="Alimenter l'EntryPoint"
							description={
								"Crédite le dépôt de gas qui paie les opérations sponsorisées.\nLe montant total déposé utilise en priorité le solde du contrat.\nSi la part du wallet est supèrieure au montant total, le surplus sera stocké dans le solde du contrat.\nLes 2 champs sont obligatoires."
							}
							icon={Fuel}
							fields={[
								{
									name: "amount",
									label: "Montant total déposé (ETH)",
									type: "ether",
									placeholder: "0.1",
								},
								{
									name: "value",
									label: "Part payée par votre wallet (ETH)",
									type: "ether",
									placeholder: "0",
									asValue: true,
								},
							]}
							submitLabel="Déposer"
							successMessage="L'EntryPoint a bien été alimenté"
							disable={paymasterPause}
							validate={(values) => {
								if (balance === undefined) return null;
								const fromContract = toWei(values.amount) - toWei(values.value);
								return fromContract > balance ?
										`Le contrat ne détient que ${formatEther(balance)} ETH`
									:	null;
							}}
						/>
						<WriteCallCard
							address={paymasterAddress}
							abi={paymasterABI}
							functionName="addStake"
							title="Alimenter le stake"
							description={
								"Verrouille la caution sans laquelle le paymaster n'est pas utilisable.\nElle est payée par votre wallet uniquement, les fonds du contrat ne sont pas utilisés."
							}
							icon={Lock}
							fields={[
								{
									name: "unstakeDelaySec",
									label: "Délai de déverrouillage (jours)",
									type: "days",
									placeholder: "1",
								},
								{
									name: "value",
									label: "Montant staké (ETH)",
									type: "ether",
									placeholder: "0.05",
									asValue: true,
								},
							]}
							submitLabel="Déposer"
							successMessage="Le stake a bien été crédité"
							disable={paymasterPause}
						/>
						<WriteCallCard
							address={paymasterAddress}
							abi={paymasterABI}
							functionName="unlockStake"
							title="Déblocage du stake"
							description={
								"Lance le délai au bout duquel l'administrateur pourra retirer le stake.\nLe paymaster cesse d'être utilisable dès le déblocage."
							}
							icon={LockOpen}
							submitLabel="Débloquer"
							successMessage="Le stake a bien été débloqué"
							danger
							disable={paymasterPause}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default Paymaster;
