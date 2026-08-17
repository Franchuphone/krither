import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import HeaderConnectButton from "../connection/HeaderConnectButton";

// Fixed, transparent overlay bar. Sits on top of the full-bleed scroll landing
// as well as the app pages.
const Header = () => {
	return (
		<header className="fixed inset-x-0 top-0 z-50">
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
						className="h-9 w-auto"
					/>
				</Link>
				<div className="flex items-center gap-3">
					<HeaderConnectButton />
				</div>
			</nav>
		</header>
	);
};

export default Header;
