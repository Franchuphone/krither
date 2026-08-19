import type { ReactNode } from "react";

const TopCardLayout = ({ children }: { children: ReactNode }) => {
	return <div className="grid w-full gap-4 sm:grid-cols-2">{children}</div>;
};

export default TopCardLayout;
