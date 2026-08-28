"use client";

import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { create } from "qrcode";
import { useId, useRef } from "react";
import { lotQrCode } from "@/app/actions/producer/lots";
import {
	getProducerDossier,
	producerQrCode,
} from "@/app/actions/producer/registration";
import { KritherMarkBold } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const WIDTH = 260;
const HEIGHT = 406.1;
const BORDER = 2;
const LEFT = 17;
const INNER = 226;
const RIGHT = 243;

/** Literal, not a token: the exported file resolves no CSS variable. */
const INK = "#266978";

/** Kept under the 30% that error correction level H tolerates. */
const RESERVE_RATIO = 0.24;

const LotLabel = ({
	lotId,
	name,
	lotRef,
	zone,
	producedAt,
}: {
	lotId?: string;
	name?: string;
	lotRef?: string;
	zone?: string;
	producedAt?: string;
}) => {
	const svgRef = useRef<SVGSVGElement>(null);
	const clipId = useId();

	const { data: qr } = useQuery({
		queryKey: ["lot-qr", lotId],
		queryFn: lotId ? () => lotQrCode(lotId) : () => producerQrCode(),
	});

	const { data: dossier } = useQuery({
		queryKey: ["producer-dossier"],
		queryFn: () => getProducerDossier(),
	});

	if (!dossier || !qr?.url) return null;

	const { modules } = create(qr.url, { errorCorrectionLevel: "H" });
	const size = modules.size;
	const reserve = Math.round(size * RESERVE_RATIO);
	const from = Math.floor((size - reserve) / 2);
	const to = from + reserve - 1;

	let d = "";
	for (let row = 0; row < size; row += 1) {
		for (let col = 0; col < size; col += 1) {
			const hidden = row >= from && row <= to && col >= from && col <= to;
			if (hidden || !modules.get(row, col)) continue;
			d += `M${col} ${row}h1v1h-1z`;
		}
	}

	const download = () => {
		if (!svgRef.current) return;
		const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
		clone.setAttribute("width", "61.2mm");
		clone.setAttribute("height", "95.7mm");
		const source = new XMLSerializer().serializeToString(clone);
		const link = document.createElement("a");
		link.href = URL.createObjectURL(
			new Blob([source], { type: "image/svg+xml" }),
		);
		link.download =
			lotRef ? `krither-${lotRef}.svg` : `krither-${dossier.companyName}.svg`;
		link.click();
		URL.revokeObjectURL(link.href);
	};

	return (
		<Popover>
			<PopoverTrigger className="mx-auto block w-65 transition-opacity hover:opacity-80">
				<svg
					ref={svgRef}
					xmlns="http://www.w3.org/2000/svg"
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					role="img"
					aria-label={
						lotRef ? `Étiquette du lot ${lotRef}` : `Étiquette de ${name}`
					}
				>
					<clipPath id={clipId}>
						<rect x={LEFT} y={60} width={INNER} height={55} />
					</clipPath>

					<rect
						x={BORDER / 2}
						y={BORDER / 2}
						width={WIDTH - BORDER}
						height={HEIGHT - BORDER}
						fill="#FFFFFF"
						stroke={INK}
						strokeWidth={BORDER}
					/>

					<g
						fill={INK}
						color={INK}
						dominantBaseline="text-before-edge"
						fontFamily="var(--font-sans, Inter), sans-serif"
					>
						<KritherMarkBold x={LEFT} y={LEFT} width={34} height={34} />

						{producedAt && lotRef && (
							<g
								textAnchor="end"
								fontSize={9.6}
								fontFamily="var(--font-mono, 'JetBrains Mono'), monospace"
							>
								<text x={RIGHT} y={LEFT}>
									LOT
								</text>
								<text x={RIGHT} y={LEFT + 13.92}>
									{lotRef}
								</text>
								<text x={RIGHT} y={LEFT + 27.84}>
									{producedAt.slice(0, 10)}
								</text>
							</g>
						)}

						<g clipPath={`url(#${clipId})`}>
							<text x={LEFT} y={69.76} fontSize={15.2} fontWeight={800}>
								{name ? name : dossier.companyName}
							</text>
							<text x={LEFT} y={96.08} fontSize={11.52}>
								{name ? dossier.companyName + " · " : ""}
								{zone ? zone : dossier.city}
							</text>
						</g>

						<g transform={`translate(${LEFT} 125.51) scale(${INNER / size})`}>
							<path d={d} shapeRendering="crispEdges" />
							<KritherMarkBold
								x={from}
								y={from}
								width={reserve}
								height={reserve}
							/>
						</g>

						<rect x={LEFT} y={362.51} width={INNER} height={1} />

						<g
							fontSize={9.12}
							fontFamily="var(--font-mono, 'JetBrains Mono'), monospace"
						>
							<text x={LEFT} y={374.51}>
								Scannez pour vérifier
							</text>
							<text x={RIGHT} y={374.51} textAnchor="end">
								krither.com
							</text>
						</g>
					</g>
				</svg>
			</PopoverTrigger>

			<PopoverContent
				side="inline-end"
				align="center"
				className="flex w-auto flex-col gap-1 p-1"
			>
				<Button
					variant="ghost"
					size="sm"
					className="hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/15 dark:hover:text-primary"
					onClick={download}
				>
					<DownloadIcon />
					Télécharger
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/15 dark:hover:text-primary"
					render={<a href={qr.url} target="_blank" rel="noopener noreferrer" />}
				>
					<ExternalLinkIcon />
					Tester le lien
				</Button>
			</PopoverContent>
		</Popover>
	);
};

export default LotLabel;
