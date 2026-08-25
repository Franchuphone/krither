"use client";

import { useQuery } from "@tanstack/react-query";
import { producerQrCode } from "@/app/actions/producer/registration";
import QrPanel from "@/components/cards/QrPanel";

const ProducerQrCode = () => {
	const { data } = useQuery({
		queryKey: ["producer-qr"],
		queryFn: producerQrCode,
	});

	if (!data?.svg) return null;

	return (
		<QrPanel
			svg={data.svg}
			url={data.url}
			label="Testez votre QR en cliquant ici"
			className="border-t border-border pt-4 sm:col-span-2"
		/>
	);
};

export default ProducerQrCode;
