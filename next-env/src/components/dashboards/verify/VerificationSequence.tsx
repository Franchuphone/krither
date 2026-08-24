"use client";

import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const steps = [
	"Vérification du producteur",
	"Vérification du numéro de lot",
	"Vérification de la conformité",
];

const stepDuration = 1200;

const VerificationSequence = ({ children }: { children: ReactNode }) => {
	const [active, setActive] = useState(-1);

	useEffect(() => {
		if (active >= steps.length) return;

		const reduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		const delay =
			reduced ? 0
			: active < 0 ? 60
			: stepDuration;

		const timer = setTimeout(() => setActive(active + 1), delay);

		return () => clearTimeout(timer);
	}, [active]);

	if (active >= steps.length) {
		return (
			<div className="flex w-full max-w-3xl flex-col gap-6 text-left animate-in fade-in duration-500">{children}</div>
		);
	}

	return (
		<div className="flex w-full max-w-3xl flex-col gap-6 text-left">
			<Card className="w-full gap-4">
				<CardHeader className="flex flex-col items-center gap-3 sm:flex-row">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
						<LoaderCircleIcon className="size-4.5 animate-spin" />
					</span>
					<span className="flex flex-col gap-1">
						<CardTitle className="text-base">
							Vérification en cours
						</CardTitle>
						<CardDescription>
							Contrôle des données du lot sur la blockchain et sur
							le service de stockage décentralisé.
						</CardDescription>
					</span>
				</CardHeader>

				<CardContent>
					<ul className="flex flex-col gap-4">
						{steps.map((label, position) => {
							const started = position <= active;
							const done = position < active;

							return (
								<li
									key={label}
									className="flex flex-col gap-1.5"
								>
									<span className="flex items-center justify-between gap-2 text-sm">
										<span
											className={
												started ? "text-foreground" : (
													"text-muted-foreground"
												)
											}
										>
											{label}
										</span>
										{done && (
											<CheckIcon className="size-4 shrink-0 text-primary" />
										)}
									</span>
									<span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
										<span
											className="block h-full rounded-full bg-primary transition-[width] ease-out"
											style={{
												width: started ? "100%" : "0%",
												transitionDuration: `${stepDuration}ms`,
											}}
										/>
									</span>
								</li>
							);
						})}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
};

export default VerificationSequence;
