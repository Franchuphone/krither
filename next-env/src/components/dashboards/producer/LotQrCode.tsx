"use client";

import { useQuery } from "@tanstack/react-query";
import { lotQrCode } from "@/app/actions/producer/lots";
import QrPanel from "@/components/cards/QrPanel";

const LotQrCode = ({ lotId }: { lotId: string }) => {
	const { data } = useQuery({
		queryKey: ["lot-qr", lotId],
		queryFn: () => lotQrCode(lotId),
	});

	if (!data?.svg || !data.url) return null;

	return (
		<QrPanel
			svg={data.svg}
			url={data.url}
			label="Testez votre lien de vérification"
		/>
	);
};

export default LotQrCode;
