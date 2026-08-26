import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";
import ConnectionGuard from "@/components/connection/ConnectionGuard";
import AppKitProvider from "@/components/providers/AppKitProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
// Layout is the app shell: Header on top, Footer at the bottom, both fixed
// overlays, with the guarded page between them.
import Layout from "@/components/layout/Layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const jetBrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Krither, la traçabilité blockchain de vos produits",
	description:
		"Une provenance transparente et infalsifiable sur la blockchain, construit pour les producteurs, artisans et créateurs",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="fr"
			suppressHydrationWarning
			className={cn(
				"h-full",
				"antialiased",
				jetBrainsMono.variable,
				"font-sans",
				inter.variable,
			)}
		>
			<body className="min-h-full flex flex-col">
				<ThemeProvider>
					<AppKitProvider>
						<Layout>
							<ConnectionGuard>{children}</ConnectionGuard>
						</Layout>
					</AppKitProvider>
				</ThemeProvider>
				<Toaster />
			</body>
		</html>
	);
}
