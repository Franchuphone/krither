import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";
import ThemeProvider from "./ThemeProvider";
import AppKitProvider from "./AppKitProvider";
import ConnectionGuard from "./ConnectionGuard";
import Layout from "@/components/layout/Layout";
// Header/Footer + wallet chrome are intentionally NOT mounted yet — the
// components exist under components/layout and components/connection and can be
// dropped in around <ConnectionGuard> when we want them shown.

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
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
				geistSans.variable,
				geistMono.variable,
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
