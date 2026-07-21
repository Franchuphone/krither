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
          className="text-xl font-extrabold tracking-tight text-foreground transition-opacity hover:opacity-70"
        >
          KRITHER
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
