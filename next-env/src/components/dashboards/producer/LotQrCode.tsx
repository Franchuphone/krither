"use client";

import { useQuery } from "@tanstack/react-query";
import { lotQrCode } from "@/app/actions/producer/lots";

const LotQrCode = ({ lotId }: { lotId: string }) => {
	const { data } = useQuery({
		queryKey: ["lot-qr", lotId],
		queryFn: () => lotQrCode(lotId),
	});

	if (!data?.svg) return null;

	return (
		<div className="flex flex-col items-center gap-2">
			<div
				className="size-40 rounded-md bg-white p-2 [&_svg]:size-full"
				dangerouslySetInnerHTML={{ __html: data.svg }}
			/>
			<span className="text-xs break-all text-muted-foreground">
				<a
					href={data.url}
					target="_blank"
					rel="noopener noreferrer"
				>
					Testez votre lien de vérification
				</a>
			</span>
		</div>
	);
};

export default LotQrCode;
