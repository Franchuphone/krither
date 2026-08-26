"use client";

import { useState } from "react";
import PauseSummary from "./PauseSummary";
import WriteCallCard from "@/components/cards/WriteCallCard";
import { registryABI, registryAddress } from "@/lib/registry";
import { Bitcoin, Container, Pause, Play } from "lucide-react";
import PillNav, { PillNavItem } from "@/components/nav/PillNav";
import { paymasterABI, paymasterAddress } from "@/lib/paymaster";
import { usePauseState } from "@/hooks/usePauseState";

const TABS = [
	{ key: "registry", label: "Registre", icon: Container },
	{ key: "paymaster", label: "Paymaster", icon: Bitcoin },
] as const satisfies readonly PillNavItem[];

const Pauser = () => {
	const [tab, setTab] = useState<string>("registry");
	const { registryPause, paymasterPause } = usePauseState();

	return (
		<div className="flex w-full max-w-3xl flex-col gap-8 text-left">
			<PauseSummary />
			<div className="flex w-full flex-col gap-6">
				<PillNav
					items={TABS}
					activeKey={tab}
					onSelect={setTab}
					label="Votre espace de gestion d'incidents"
				/>

				{tab === "registry" && (
					<div className="flex flex-col gap-3">
						<WriteCallCard
							address={registryAddress}
							abi={registryABI}
							functionName="pause"
							title="Pause du registre"
							description="Mise en pause d'urgences du registre en cas d'incident de sécurité"
							icon={Pause}
							submitLabel="Pause"
							successMessage="Registre mis en pause"
							danger={true}
							disable={registryPause}
						/>
						<WriteCallCard
							address={registryAddress}
							abi={registryABI}
							functionName="unpause"
							title="Mise en service du registre"
							description="Remise en service du registre après un incident de sécurité"
							icon={Play}
							submitLabel="Mise en service"
							successMessage="Registre remis en service"
							danger={true}
							disable={!registryPause}
						/>
					</div>
				)}

				{tab === "paymaster" && (
					<div className="flex flex-col gap-3">
						<WriteCallCard
							address={paymasterAddress}
							abi={paymasterABI}
							functionName="pause"
							title="Pause du paymaster"
							description="Mise en pause d'urgences du paymaster en cas d'incident de sécurité"
							icon={Pause}
							submitLabel="Pause"
							successMessage="Paymaster mis en pause"
							danger
							disable={paymasterPause}
						/>
						<WriteCallCard
							address={paymasterAddress}
							abi={paymasterABI}
							functionName="unpause"
							title="Mise en service du paymaster"
							description="Remise en service du paymaster après un incident de sécurité"
							icon={Play}
							submitLabel="Mise en service"
							successMessage="Paymaster remis en service"
							danger
							disable={!paymasterPause}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default Pauser;
