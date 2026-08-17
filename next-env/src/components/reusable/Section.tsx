import React from "react";

const Section = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => {
	return (
		<section className="flex w-full flex-col gap-3">
			<h2 className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
				{title}
			</h2>
			{children}
		</section>
	);
};

export default Section;
