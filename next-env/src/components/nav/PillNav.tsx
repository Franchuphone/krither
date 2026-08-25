"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type PillNavItem = {
	key: string;
	label: string;
	/** Navigates when set, otherwise the pill reports through onSelect. */
	href?: string;
	/** Replaces the label, which stays as the accessible name. */
	icon?: LucideIcon;
};

type Indicator = { left: number; top: number; width: number; height: number };

const pillClass =
	"relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors";

const PillNav = ({
	items,
	activeKey,
	onSelect,
	label,
}: {
	items: readonly PillNavItem[];
	activeKey?: string;
	onSelect?: (key: string) => void;
	label?: string;
}) => {
	const container = useRef<HTMLElement>(null);
	const [indicator, setIndicator] = useState<Indicator | null>(null);

	// Measured rather than animated between classes, so the pill slides.
	useEffect(() => {
		const node = container.current;
		if (!node) return;

		const measure = () => {
			const active = node.querySelector<HTMLElement>('[data-active="true"]');
			setIndicator(
				active ?
					{
						left: active.offsetLeft,
						top: active.offsetTop,
						width: active.offsetWidth,
						height: active.offsetHeight,
					}
				:	null,
			);
		};

		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	}, [activeKey, items]);

	if (items.length === 0) return null;

	return (
		<nav
			ref={container}
			aria-label={label}
			className="relative mx-auto flex flex-wrap items-center justify-center gap-1 rounded-full bg-card p-1 ring-1 ring-border"
		>
			{indicator && (
				<span
					aria-hidden
					className="absolute rounded-full bg-primary transition-[translate,width,height] duration-300 ease-out motion-reduce:transition-none"
					style={{
						translate: `${indicator.left}px ${indicator.top}px`,
						width: indicator.width,
						height: indicator.height,
						insetInlineStart: 0,
						insetBlockStart: 0,
					}}
				/>
			)}

			{items.map((item) => {
				const isActive = item.key === activeKey;
				const Icon = item.icon;
				const classes = cn(
					pillClass,
					Icon && "px-3.5",
					isActive ?
						"text-primary-foreground"
					:	"text-muted-foreground hover:text-primary",
				);

				const content =
					Icon ?
						<Icon aria-hidden className="size-4.5" />
					:	item.label;

				return item.href ?
						<Link
							key={item.key}
							href={item.href}
							data-active={isActive}
							aria-current={isActive ? "page" : undefined}
							aria-label={Icon ? item.label : undefined}
							title={Icon ? item.label : undefined}
							className={classes}
						>
							{content}
						</Link>
					:	<button
							key={item.key}
							type="button"
							data-active={isActive}
							aria-current={isActive ? "true" : undefined}
							aria-label={Icon ? item.label : undefined}
							title={Icon ? item.label : undefined}
							className={cn(classes, "cursor-pointer")}
							onClick={() => onSelect?.(item.key)}
						>
							{content}
						</button>;
			})}
		</nav>
	);
};

export default PillNav;
