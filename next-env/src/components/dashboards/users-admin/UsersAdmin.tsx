"use client";

import {
	FileCheck2,
	UserMinus,
	UserPlus,
	Users as UsersIcon,
	UserSearch,
} from "lucide-react";
import { useState } from "react";
import ReadCallCard from "@/components/cards/ReadCallCard";
import PillNav, { type PillNavItem } from "@/components/nav/PillNav";
import WriteCallCard from "@/components/cards/WriteCallCard";
import { accountField, roleField } from "@/lib/contractFields";
import { registryABI, registryAddress } from "@/lib/registry";
import { USER_ROLE_OPTIONS } from "@/lib/roles";
import ProducerRequests from "./ProducerRequests";

const TABS = [
	{ key: "requests", label: "Demandes d'accréditation", icon: FileCheck2 },
	{ key: "accounts", label: "Gestion des comptes", icon: UsersIcon },
] as const satisfies readonly PillNavItem[];

const UsersAdmin = () => {
	const [tab, setTab] = useState<string>("requests");

	return (
		<div className="flex w-full max-w-3xl flex-col gap-8 text-left">
			<div className="flex w-full flex-col gap-6">
				<PillNav
					items={TABS}
					activeKey={tab}
					onSelect={setTab}
					label="Votre espace de gestion des utilisateurs"
				/>

				<div className="flex flex-col gap-3">
					{tab === "requests" && <ProducerRequests />}

					{tab === "accounts" && (
						<>
							<WriteCallCard
								address={registryAddress}
								abi={registryABI}
								functionName="grantRole"
								title="Ajouter une accréditation"
								description="Autorise un compte à utiliser la plateforme avec un statut donné"
								icon={UserPlus}
								fields={[roleField(USER_ROLE_OPTIONS), accountField]}
								submitLabel="Attribuer"
								successMessage="Statut attribué"
							/>
							<WriteCallCard
								address={registryAddress}
								abi={registryABI}
								functionName="revokeRole"
								title="Retirer une accréditation"
								description="Retire un compte de la plateforme en révoquant son statut"
								icon={UserMinus}
								fields={[roleField(USER_ROLE_OPTIONS), accountField]}
								submitLabel="Révoquer"
								successMessage="Statut révoqué"
							/>
							<ReadCallCard
								address={registryAddress}
								abi={registryABI}
								functionName="hasRole"
								title="Contrôler une accréditation"
								description="Contrôle le statut d'un compte"
								icon={UserSearch}
								fields={[roleField(USER_ROLE_OPTIONS), accountField]}
							/>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default UsersAdmin;
