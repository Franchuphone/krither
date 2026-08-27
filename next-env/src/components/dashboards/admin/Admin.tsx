"use client";

import {
	ArrowLeftRight,
	Coins,
	HandCoins,
	Landmark,
	Link2,
	Locate,
	PiggyBank,
	UserMinus,
	UserPlus,
	Users,
	UserSearch,
} from "lucide-react";
import { useState } from "react";
import PauseSummary from "@/components/dashboards/pauser/PauseSummary";
import FundingSummary from "@/components/dashboards/paymaster/FundingSummary";
import ReadCallCard from "@/components/cards/ReadCallCard";
import PillNav, { type PillNavItem } from "@/components/nav/PillNav";
import WriteCallCard from "@/components/cards/WriteCallCard";
import { paymasterABI, paymasterAddress } from "@/lib/paymaster";
import { registryABI, registryAddress } from "@/lib/registry";
import { accountField, roleField } from "@/lib/contractFields";
import { ADMIN_ROLE_OPTIONS } from "@/lib/roles";

const TABS = [
	{ key: "accounts", label: "Rôles d'administration", icon: Users },
	{ key: "documents", label: "Ancrage des documents", icon: Locate },
	{ key: "treasury", label: "Trésorerie", icon: Landmark },
] as const satisfies readonly PillNavItem[];

const Admin = () => {
	const [tab, setTab] = useState<string>("accounts");

	return (
		<div className="flex w-full max-w-3xl flex-col gap-8 text-left">
			<PauseSummary />
			<FundingSummary />

			<div className="flex w-full flex-col gap-6">
				<PillNav
					items={TABS}
					activeKey={tab}
					onSelect={setTab}
					label="Votre espace administrateur"
				/>

				<div className="flex flex-col gap-3">
					{tab === "accounts" && (
						<>
							<WriteCallCard
								address={registryAddress}
								abi={registryABI}
								functionName="grantRole"
								title="Ajouter un administrateur"
								description="Confie à un compte un des statuts d'administration de la plateforme"
								icon={UserPlus}
								fields={[roleField(ADMIN_ROLE_OPTIONS), accountField]}
								submitLabel="Attribuer"
								successMessage="Statut attribué"
							/>
							<WriteCallCard
								address={registryAddress}
								abi={registryABI}
								functionName="revokeRole"
								title="Retirer un administrateur"
								description="Retire à un compte l'un des statuts d'administration"
								icon={UserMinus}
								fields={[roleField(ADMIN_ROLE_OPTIONS), accountField]}
								submitLabel="Révoquer"
								successMessage="Statut révoqué"
							/>
							<ReadCallCard
								address={registryAddress}
								abi={registryABI}
								functionName="hasRole"
								title="Contrôler un administrateur"
								description="Contrôle le statut d'administration d'un compte"
								icon={UserSearch}
								fields={[roleField(ADMIN_ROLE_OPTIONS), accountField]}
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
								danger
							/>
						</>
					)}

					{tab === "documents" && (
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
					)}

					{tab === "treasury" && (
						<>
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
								description={
									"Récupère le dépôt de gas auprès de l'EntryPoint.\nLe sponsoring s'arrête dès qu'il est vide."
								}
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
								description={
									"Récupère la totalité du stake.\nIl doit avoir été déverrouillé par le gestionnaire du paymaster et le délai écoulé."
								}
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
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default Admin;
