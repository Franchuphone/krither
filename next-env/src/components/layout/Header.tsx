"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import HeaderConnectButton from "@/components/buttons/HeaderConnectButton";

const TOP_THRESHOLD = 8;

const Header = () => {
	const [atTop, setAtTop] = useState(true);

	useEffect(() => {
		let frame = 0;

		const read = () => {
			frame = 0;
			setAtTop(window.scrollY <= TOP_THRESHOLD);
		};

		const onScroll = () => {
			if (frame) return;
			frame = window.requestAnimationFrame(read);
		};

		read();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });

		return () => {
			if (frame) window.cancelAnimationFrame(frame);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, []);

	return (
		<header
			aria-hidden={!atTop}
			className={`fixed inset-x-0 top-0 z-50 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
				atTop ?
					"translate-y-0 opacity-100"
				:	"pointer-events-none -translate-y-full opacity-0"
			}`}
		>
			<nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
				<Link
					href="/"
					aria-label="Krither home"
					className="flex items-center transition-opacity hover:opacity-70"
				>
					<Image
						src="/logo/logo.png"
						alt="Krither"
						width={552}
						height={488}
						priority
						className="h-12 w-auto sm:h-14 dark:brightness-[2.6]"
					/>
				</Link>
				<div className="flex items-center gap-3">
					<ThemeToggle />
					<HeaderConnectButton />
				</div>
			</nav>
		</header>
	);
};

export default Header;
