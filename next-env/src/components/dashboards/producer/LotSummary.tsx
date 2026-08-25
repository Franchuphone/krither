"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, PackageCheck } from "lucide-react";
import { useConnection } from "wagmi";
import { countProducerLots } from "@/app/actions/producer/lots";
import InfoCard from "@/components/cards/InfoCard";
import TopCardLayout from "@/components/cards/TopCardLayout";

const LotSummary = () => {
	const { address } = useConnection();

	const { data: counts } = useQuery({
		queryKey: ["producer-lots", address],
		queryFn: () => countProducerLots(address as string),
		enabled: !!address,
	});

	const drafts = counts && counts.total - counts.minted;

	return (
		<TopCardLayout>
			<InfoCard
				label="Lots enregistrés"
				value={counts?.total.toString()}
				hint={
					drafts === undefined ? "Brouillons et lots ancrés."
					: drafts === 0 ? "Tous vos lots sont ancrés."
					: `Dont ${drafts} en préparation.`
				}
				icon={Boxes}
			/>
			<InfoCard
				label="Lots ancrés"
				value={counts?.minted.toString()}
				hint="Mintés sur la blockchain, définitifs."
				icon={PackageCheck}
			/>
		</TopCardLayout>
	);
};

export default LotSummary;
