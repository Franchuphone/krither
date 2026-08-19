"use client";

import { ChevronDownIcon } from "lucide-react";
import React from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Section = ({
	title,
	children,
	defaultOpen = false,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) => {
	return (
		<Collapsible
			defaultOpen={defaultOpen}
			render={<section className="flex w-full flex-col gap-3" />}
		>
			{/* The heading wraps the button: a button may not contain an h2. */}
			<h2 className=" text-lg font-semibold tracking-[0.2em] text-primary uppercase">
				<CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-2 text-left">
					<ChevronDownIcon className="size-3.5 shrink-0 transition-transform duration-200 group-data-panel-open:rotate-180" />
					{title}
				</CollapsibleTrigger>
			</h2>

			{/* -m-px + p-px keeps overflow-hidden from clipping the cards' ring. */}
			<CollapsibleContent className="-m-px h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
				<div className="flex flex-col gap-3 p-px">{children}</div>
			</CollapsibleContent>
		</Collapsible>
	);
};

export default Section;
