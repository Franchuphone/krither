"use client";

import "./globals.css";

// Replaces the root layout when it is the layout itself that failed, so it
// carries its own html/body and depends on no provider.
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="fr">
			<body className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
				<div className="flex flex-col items-center gap-4">
					<h1 className="text-lg font-semibold text-foreground">
						Une erreur critique est survenue
					</h1>
					<p className="text-sm text-muted-foreground">
						{error.digest ?
							`Référence de l'incident : ${error.digest}`
						:	"L'application n'a pas pu démarrer."}
					</p>
					<button
						type="button"
						onClick={reset}
						className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
					>
						Recharger
					</button>
				</div>
			</body>
		</html>
	);
}
