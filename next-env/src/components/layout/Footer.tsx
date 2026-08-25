import ThemeToggle from "./ThemeToggle";

// Fixed overlay bar carrying the theme toggle. Mounted by Layout on every page.
const Footer = () => {
	return (
		<footer className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between px-6 py-6 sm:px-10">
			<ThemeToggle />
		</footer>
	);
};

export default Footer;
