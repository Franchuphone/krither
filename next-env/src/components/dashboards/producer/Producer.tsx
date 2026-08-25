"use client";

import {
	PackagePlusIcon,
	PackageSearchIcon,
	UserRoundIcon,
} from "lucide-react";
import { useState } from "react";
import SessionGate from "@/components/connection/SessionGate";
import PillNav, { type PillNavItem } from "@/components/nav/PillNav";
import LotDraftForm from "./LotDraftForm";
import LotList from "./LotList";
import LotSummary from "./LotSummary";
import ProducerProfile from "./ProducerProfile";

const TABS = [
	{ key: "profile", label: "Profil", icon: UserRoundIcon },
	{ key: "lots", label: "Lots", icon: PackageSearchIcon },
	{ key: "draft", label: "Créer un lot", icon: PackagePlusIcon },
] as const satisfies readonly PillNavItem[];

const Producer = () => {
	const [tab, setTab] = useState<string>("profile");

	return (
		<div className="flex w-full max-w-3xl flex-col gap-8 text-left">
			<LotSummary />

			<SessionGate
				title="Vérification requise"
				description={
					<>
						Les actions sur vos lots génèrent des données sensibles.
						<br /> Pour des raisons de sécurité, veuillez vérifier votre
						session.
					</>
				}
			>
				<div className="flex w-full flex-col gap-6">
					<PillNav
						items={TABS}
						activeKey={tab}
						onSelect={setTab}
						label="Votre espace producteur"
					/>

					<div className="flex flex-col gap-3">
						{tab === "profile" && <ProducerProfile />}
						{tab === "lots" && <LotList />}
						{tab === "draft" && <LotDraftForm />}
					</div>
				</div>
			</SessionGate>
		</div>
	);
};

export default Producer;
