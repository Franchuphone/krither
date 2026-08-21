"use client";

import SessionGate from "@/components/connection/SessionGate";
import WriteCallCard from "@/components/reusable/WriteCallCard";
import { registryABI } from "@/lib/registry";
import Section from "../reusable/Section";
import ReadCallCard from "../reusable/ReadCallCard";
import LotList from "./LotList";
import LotDraftForm from "./LotDraftForm";
import LotSummary from "./LotSummary";

const registryAddress = process.env
	.NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS as `0x${string}`;

const Producer = () => {
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
				<Section title="Lots" defaultOpen>
					<LotList />
				</Section>

				<Section title="Créer un lot">
					<LotDraftForm />
				</Section>
			</SessionGate>
		</div>
	);
};

export default Producer;
