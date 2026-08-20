"use client";

import {
	ArrowLeftRight,
	BadgePlus,
	Coins,
	HandCoins,
	Link2,
	PiggyBank,
	SlidersHorizontal,
	UserMinus,
	UserPlus,
	UserSearch,
} from "lucide-react";
import FundingSummary from "@/components/dashboards/FundingSummary";
import WriteCallCard from "@/components/reusable/WriteCallCard";
import { paymasterABI } from "@/lib/paymaster";
import { registryABI } from "@/lib/registry";
import { ROLE_OPTIONS } from "@/lib/roles";
import Section from "../reusable/Section";
import ReadCallCard from "../reusable/ReadCallCard";
import PauseSummary from "./PauseSummary";
import ProducerRequests from "./ProducerRequests";

const registryAddress = process.env
	.NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS as `0x${string}`;
const paymasterAddress = process.env
	.NEXT_PUBLIC_PAYMASTER_PRODUCTION_ADDRESS as `0x${string}`;

const roleField = {
	name: "role",
	label: "Statut",
	type: "bytes32",
	placeholder: "Choisir un statut",
	options: ROLE_OPTIONS,
} as const;

const Admin = () => {
	return (
		<div className="flex w-full max-w-3xl flex-col gap-8 text-left">
			<PauseSummary />
			<FundingSummary />

			<Section title="Demandes d'accréditation" defaultOpen>
				<ProducerRequests />
			</Section>

			<Section title="Gestion des comptes">
				<WriteCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="grantRole"
					title="Ajouter une accréditation"
					description="Autorise un compte à utiliser la plateforme avec un statut donné"
					icon={UserPlus}
					fields={[
						roleField,
						{
							name: "account",
							label: "Compte",
							type: "address",
							placeholder: "0x…",
						},
					]}
					submitLabel="Attribuer"
					successMessage="Statut attribué"
				/>
				<WriteCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="revokeRole"
					title="Retirer une accréditation"
					description="Retire un compte de la plateforme  en révoquant son statut"
					icon={UserMinus}
					fields={[
						roleField,
						{
							name: "account",
							label: "Compte",
							type: "address",
							placeholder: "0x…",
						},
					]}
					submitLabel="Révoquer"
					successMessage="Statut révoqué"
				/>
				<ReadCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="hasRole"
					title="Contrôler une accréditation"
					description={"Contrôle le statut d'un compte"}
					icon={UserSearch}
					fields={[
						roleField,
						{
							name: "account",
							label: "Compte",
							type: "address",
							placeholder: "0x…",
						},
					]}
				/>
				<WriteCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="reassignProducer"
					title="Changer le wallet d'un producteur"
					description="Transfère un identifiant de producteur vers un nouveau wallet"
					icon={ArrowLeftRight}
					fields={[
						{
							name: "oldAddress",
							label: "Wallet actuel",
							type: "address",
							placeholder: "0x…",
						},
						{
							name: "newAddress",
							label: "Nouveau wallet",
							type: "address",
							placeholder: "0x…",
						},
					]}
					submitLabel="Réassigner"
					successMessage="Producteur réassigné"
				/>
			</Section>

			<Section title="Ancrage des documents offchain">
				<WriteCallCard
					address={registryAddress}
					abi={registryABI}
					functionName="addLocator"
					title="Ajouter un localisateur de fichiers"
					description="Ancre un pointeur de stockage alternatif pour un lot, en complément de son CID IPFS"
					icon={Link2}
					fields={[
						{
							name: "idLot",
							label: "Identifiant du lot",
							type: "uint",
							placeholder: "1",
						},
						{
							name: "service",
							label: "Service",
							type: "string",
							placeholder: "arweave",
						},
						{
							name: "pointer",
							label: "Pointeur",
							type: "string",
							placeholder: "Identifiant de transaction, URL…",
						},
					]}
					submitLabel="Ancrer"
					successMessage="Localisateur ancré"
				/>
			</Section>

			<Section title="Formules d'abonnement">
				<WriteCallCard
					address={paymasterAddress}
					abi={paymasterABI}
					functionName="addPlan"
					title="Créer une formule"
					description="Crée une formule de sponsoring pour un statut. Le quota correspond au nombre d'opérations par période"
					icon={BadgePlus}
					fields={[
						roleField,
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
							label: "Période (secondes)",
							type: "uint",
							placeholder: "2592000",
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
							label: "Période (secondes)",
							type: "uint",
							placeholder: "2592000",
						},
						{ name: "enabled", label: "En vente", type: "bool" },
					]}
					submitLabel="Modifier la formule"
					successMessage="Formule modifiée"
				/>
			</Section>

			<Section title="Trésorerie">
				<WriteCallCard
					address={paymasterAddress}
					abi={paymasterABI}
					functionName="withdrawRevenue"
					title="Retrait des fonds"
					description="Transfère vers un wallet les revenus liés aux abonnements"
					icon={Coins}
					fields={[
						{
							name: "to",
							label: "Destination",
							type: "address",
							placeholder: "0x…",
						},
						{
							name: "amount",
							label: "Montant (ETH)",
							type: "ether",
							placeholder: "0.1",
						},
					]}
					submitLabel="Retirer"
					successMessage="Revenus retirés"
					danger
				/>
				<WriteCallCard
					address={paymasterAddress}
					abi={paymasterABI}
					functionName="withdrawFromEntryPoint"
					title="Retrait du dépôt"
					description="Récupère le dépôt de gas auprès de l'EntryPoint. Le sponsoring s'arrête dès qu'il est vide."
					icon={HandCoins}
					fields={[
						{
							name: "to",
							label: "Destination",
							type: "address",
							placeholder: "0x…",
						},
						{
							name: "amount",
							label: "Montant (ETH)",
							type: "ether",
							placeholder: "0.1",
						},
					]}
					submitLabel="Retirer"
					successMessage="Dépôt retiré"
					danger
				/>
				<WriteCallCard
					address={paymasterAddress}
					abi={paymasterABI}
					functionName="withdrawStake"
					title="Retrait du stake"
					description="Récupère la totalité du stake. Il doit avoir été déverrouillé par le gestionnaire du paymaster et le délai écoulé."
					icon={PiggyBank}
					fields={[
						{
							name: "to",
							label: "Destination",
							type: "address",
							placeholder: "0x…",
						},
					]}
					submitLabel="Retirer"
					successMessage="Stake retiré"
					danger
				/>
			</Section>
		</div>
	);
};

export default Admin;
