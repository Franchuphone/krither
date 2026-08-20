"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type PillNavItem = {
	key: string;
	label: string;
	/** Navigates when set, otherwise the pill reports through onSelect. */
	href?: string;
};

type Indicator = { left: number; top: number; width: number; height: number };

const pillClass =
	"relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors";

const PillNav = ({
	items,
	activeKey,
	onSelect,
	className,
	label,
}: {
	items: readonly PillNavItem[];
	activeKey?: string;
	onSelect?: (key: string) => void;
	className?: string;
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
			className={cn(
				"relative mx-auto flex flex-wrap items-center justify-center gap-1 rounded-full bg-card p-1 ring-1 ring-border",
				className,
			)}
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
				const classes = cn(
					pillClass,
					isActive ?
						"text-primary-foreground"
					:	"text-muted-foreground hover:text-primary",
				);

				return item.href ?
						<Link
							key={item.key}
							href={item.href}
							data-active={isActive}
							aria-current={isActive ? "page" : undefined}
							className={classes}
						>
							{item.label}
						</Link>
					:	<button
							key={item.key}
							type="button"
							data-active={isActive}
							aria-current={isActive ? "true" : undefined}
							className={cn(classes, "cursor-pointer")}
							onClick={() => onSelect?.(item.key)}
						>
							{item.label}
						</button>;
			})}
		</nav>
	);
};

export default PillNav;
