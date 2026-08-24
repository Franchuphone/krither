"use client";

import { useQuery } from "@tanstack/react-query";
import { producerQrCode } from "@/app/actions/producer/registration";

const ProducerQrCode = () => {
	const { data } = useQuery({
		queryKey: ["producer-qr"],
		queryFn: producerQrCode,
	});

	if (!data?.svg) return null;

	return (
		<div className="flex flex-col items-center gap-2 border-t border-border pt-4 sm:col-span-2">
			<div
				className="pt-2 size-40 rounded-md bg-white p-2 [&_svg]:size-full"
				dangerouslySetInnerHTML={{ __html: data.svg }}
			/>
			<span className="text-xs break-all text-muted-foreground">
				<a href={data.url} target="_blank" rel="noopener noreferrer">
					Testez votre QR en cliquant ici
				</a>
			</span>
		</div>
	);
};

export default ProducerQrCode;
