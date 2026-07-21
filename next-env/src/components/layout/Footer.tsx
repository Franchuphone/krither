import ThemeToggle from "./ThemeToggle";

const GITHUB_URL = "https://github.com/Franchuphone/krither";

// Not mounted yet (see app/layout.tsx). Ready to drop into the app shell later.
const Footer = () => {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between px-6 py-6 sm:px-10">
      <ThemeToggle />
    </footer>
  );
};

export default Footer;
