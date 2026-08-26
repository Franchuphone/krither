"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";

/**
 * A single frame is pinned to the viewport while the page scrolls through a
 * tall "track". Scroll progress drives a crossfade between beats. Two things
 * keep the beats from ever visually overlapping when the user stops scrolling:
 *
 *  1. Invisible scroll-snap markers, one per beat, with
 *     `scroll-snap-type: y mandatory` on <html>. The scroll ALWAYS rests exactly
 *     on a beat — never halfway between two, so words are never superposed.
 *  2. The readable copy fades on a tighter window than the giant letters, so
 *     even mid-transit two blocks of text don't stack on each other.
 *
 * Beats are the big name, one gigantic letter of KRITHER each with a line of
 * information, then the name again. Colours come entirely from the project's
 * design tokens (--primary, etc.).
 */

type LetterBeat = {
	kind: "letter";
	char: string;
	word: string;
	text: ReactNode;
};
type Beat = { kind: "hero" } | LetterBeat | { kind: "final" };

const NAME = "KRITHER";
const CONTACT_EMAIL = "NoMail@ForTheMoment.com";
const CONTACT_SUBJECT = "À propos de Krither";

/** Scroll distance (in vh) spent moving from one beat to the next. */
const GAP_VH = 90;

const LETTERS: Omit<LetterBeat, "kind">[] = [
	{
		char: "K",
		word: "Kilomètre zéro",
		text: "L’origine de chaque produit est connue et vérifiable, dès le tout premier maillon de la chaîne",
	},
	{
		char: "R",
		word: "Référencé",
		text: "Chaque produit est inscrit sur la blockchain, enregistré par celles et ceux qui l’ont réellement fabriqué",
	},
	{
		char: "I",
		word: "Immuable",
		text: (
			<>
				Une fois enregistré, une inscription ne peut être ni modifiée, ni
				supprimée, ni falsifiée. <strong className="font-bold">Jamais</strong>
			</>
		),
	},
	{
		char: "T",
		word: "Transparent",
		text: "Scannez un produit et remontez toute la chaîne jusqu’à la source",
	},
	{
		char: "H",
		word: "Humain",
		text: "Conçu pour les producteurs, les artisans et les créateurs",
	},
	{
		char: "E",
		word: "Équité",
		text: "Du champ au consommateur, de l'atelier à l'acheteur, la valeur revient à celles et ceux qui la créent, sans intermédiaire qui s’interpose",
	},
	{
		char: "R",
		word: "Réalité",
		text: "Les informations affichées sont celles réellement fournies par le producteur, vérifiées et infalsifiables",
	},
];

const BEATS: Beat[] = [
	{ kind: "hero" },
	...LETTERS.map((l): LetterBeat => ({ kind: "letter", ...l })),
	{ kind: "final" },
];

const TRACK_VH = (BEATS.length - 1) * GAP_VH + 100;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smoothstep = (x: number) => x * x * (3 - 2 * x);

/** Scroll position expressed as a float in [0, BEATS.length - 1]. */
function useScrollBeat(trackRef: React.RefObject<HTMLDivElement | null>) {
	const [progress, setProgress] = useState(0);
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const root = document.documentElement;
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

		const applyMode = () => {
			setReduced(mq.matches);
			// Snap only when the motion engine is live.
			root.style.scrollSnapType = mq.matches ? "" : "y mandatory";
		};
		applyMode();
		mq.addEventListener("change", applyMode);

		let raf = 0;
		const update = () => {
			raf = 0;
			const track = trackRef.current;
			if (!track) return;
			const total = track.offsetHeight - window.innerHeight;
			const scrolled = clamp(-track.getBoundingClientRect().top, 0, total);
			const p = total > 0 ? (scrolled / total) * (BEATS.length - 1) : 0;
			setProgress(p);
		};
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(update);
		};

		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			mq.removeEventListener("change", applyMode);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			root.style.scrollSnapType = "";
			if (raf) cancelAnimationFrame(raf);
		};
	}, [trackRef]);

	return { progress, reduced };
}

/* ---------- beat content; `copyOpacity`/`copyShift` drive the readable text --- */

function HeroContent({
	copyOpacity,
	copyShift,
}: {
	copyOpacity: number;
	copyShift: number;
}) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
			<p
				className="mb-8 font-mono text-sm tracking-[0.35em] text-muted-foreground uppercase"
				style={{
					opacity: copyOpacity,
					transform: `translateY(${copyShift}px)`,
				}}
			>
				Traçabilité blockchain de la chaîne de production
			</p>
			<h1 className="text-[19vw] font-extrabold leading-none tracking-tighter text-foreground sm:text-[16vw] md:text-[14vw]">
				{NAME}
			</h1>
			<p
				className="mt-8 max-w-md text-lg text-muted-foreground sm:text-xl"
				style={{
					opacity: copyOpacity,
					transform: `translateY(${copyShift}px)`,
				}}
			>
				Transparente et infalsifiable, pour celles et ceux qui nourrissent et
				façonnent notre monde
			</p>
		</div>
	);
}

function LetterContent({
	beat,
	index,
	inverted,
	copyOpacity,
	copyShift,
}: {
	beat: LetterBeat;
	index: number;
	inverted: boolean;
	copyOpacity: number;
	copyShift: number;
}) {
	return (
		<div className="relative h-full w-full overflow-hidden">
			{/* Giant letter — crossfades with the layer, not the copy. */}
			<span
				aria-hidden
				className={[
					"pointer-events-none absolute inset-0 flex items-center justify-center font-extrabold leading-none tracking-tighter",
					"text-[62vw] sm:text-[52vw] md:text-[44vw] lg:text-[38vw]",
					inverted ? "text-primary-foreground/10" : "text-primary/10",
				].join(" ")}
			>
				{beat.char}
			</span>

			{/* Readable copy — tighter fade window so it never doubles up. */}
			<div
				className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-8 sm:px-14"
				style={{
					opacity: copyOpacity,
					transform: `translateY(${copyShift}px)`,
				}}
			>
				<span
					className={[
						"mb-6 font-mono text-sm tracking-[0.3em] uppercase",
						inverted ? "text-primary-foreground/70" : "text-muted-foreground",
					].join(" ")}
				>
					{String(index).padStart(2, "0")} /{" "}
					{String(LETTERS.length).padStart(2, "0")}
				</span>
				<h2 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
					{beat.word}
				</h2>
				<p
					className={[
						"mt-8 max-w-xl text-lg leading-relaxed sm:text-xl",
						inverted ? "text-primary-foreground/85" : "text-muted-foreground",
					].join(" ")}
				>
					{beat.text}
				</p>
			</div>

			<span
				aria-hidden
				className={[
					"absolute bottom-8 right-8 text-2xl font-bold sm:bottom-12 sm:right-14",
					inverted ? "text-primary-foreground/60" : "text-primary/60",
				].join(" ")}
			>
				{beat.char}
			</span>
		</div>
	);
}

function FinalContent({
	copyOpacity,
	copyShift,
	active,
}: {
	copyOpacity: number;
	copyShift: number;
	active: boolean;
}) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
			<h2 className="text-[19vw] font-extrabold leading-none tracking-tighter text-primary sm:text-[16vw] md:text-[14vw]">
				{NAME}
			</h2>
			<p
				className="mt-6 font-mono text-sm tracking-[0.3em] text-muted-foreground uppercase"
				style={{
					opacity: copyOpacity,
					transform: `translateY(${copyShift}px)`,
				}}
			>
				De l&apos;origine jusqu&apos;à vous, sur la blockchain
			</p>
			{/* Animation is gated on `active`: the classes (and the fade-in) only
          apply once the user actually arrives on this beat, instead of firing
          on mount. Re-arriving replays it. */}
			<Button
				render={
					<a
						href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
							CONTACT_SUBJECT,
						)}`}
					/>
				}
				nativeButton={false}
				// Invisible off-beat, so keep it out of the tab order too.
				tabIndex={active ? 0 : -1}
				className={cn(
					"mt-12 h-auto p-2.5 text-lg sm:mt-25 sm:p-4 sm:text-4xl",
					active ?
						"animate-in fade-in-0 slide-in-from-bottom-2 delay-1000 duration-2000 fill-mode-both"
					:	"opacity-0",
				)}
			>
				NOUS CONTACTER
			</Button>
		</div>
	);
}

function beatBackground(beat: Beat, index: number) {
	if (beat.kind === "letter" && index % 2 === 1)
		return "bg-primary text-primary-foreground";
	return "bg-background text-foreground";
}

function BeatBody({
	beat,
	index,
	copyOpacity = 1,
	copyShift = 0,
	active = true,
}: {
	beat: Beat;
	index: number;
	copyOpacity?: number;
	copyShift?: number;
	active?: boolean;
}) {
	if (beat.kind === "hero")
		return <HeroContent copyOpacity={copyOpacity} copyShift={copyShift} />;
	if (beat.kind === "final")
		return (
			<FinalContent
				copyOpacity={copyOpacity}
				copyShift={copyShift}
				active={active}
			/>
		);
	return (
		<LetterContent
			beat={beat}
			index={index}
			inverted={index % 2 === 1}
			copyOpacity={copyOpacity}
			copyShift={copyShift}
		/>
	);
}

/* ---------------------------- animated version ---------------------------- */

function BeatLayer({
	beat,
	index,
	progress,
}: {
	beat: Beat;
	index: number;
	progress: number;
}) {
	// Layer arrives (fades + scales in) and then stays; higher layers cover it,
	// so the giant letters dissolve cleanly with no muddy blend.
	const arrive = smoothstep(clamp(progress - index + 1));
	// Readable copy uses a tight symmetric window (±0.55 beat) so two text blocks
	// are never on screen together.
	const near = clamp(1 - Math.abs(progress - index) / 0.55);
	const copyOpacity = smoothstep(near);
	const isTop = Math.round(progress) === index;

	const style: CSSProperties = {
		opacity: index === 0 ? 1 : arrive,
		transform: `scale(${1 + (1 - arrive) * 0.06})`,
		pointerEvents: isTop ? "auto" : "none",
		zIndex: index,
	};

	return (
		<div
			aria-hidden={!isTop}
			className={`absolute inset-0 h-full w-full ${beatBackground(beat, index)}`}
			style={style}
		>
			<BeatBody
				beat={beat}
				index={index}
				copyOpacity={copyOpacity}
				copyShift={(1 - copyOpacity) * 28}
				active={isTop}
			/>
		</div>
	);
}

function ScrollHint() {
	return (
		<div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-4 text-muted-foreground">
			<span className="font-mono text-sm tracking-[0.35em] uppercase">
				Scroll
			</span>
			<span className="h-14 w-1 animate-pulse rounded-full bg-linear-to-b from-primary to-transparent" />
		</div>
	);
}

const NotConnectedHome = () => {
	const trackRef = useRef<HTMLDivElement>(null);
	const { progress, reduced } = useScrollBeat(trackRef);

	// Reduced-motion / no-JS friendly fallback: plain stacked full-screen beats.
	if (reduced) {
		return (
			<main className="bg-background text-foreground">
				{BEATS.map((beat, i) => (
					<section
						key={i}
						className={`flex h-screen w-full ${beatBackground(beat, i)}`}
					>
						<BeatBody beat={beat} index={i} />
					</section>
				))}
			</main>
		);
	}

	const showHint = progress < 0.4;

	return (
		<main className="bg-background text-foreground">
			<div
				ref={trackRef}
				className="relative"
				style={{ height: `${TRACK_VH}vh` }}
			>
				{/* Invisible snap markers — one per beat — force the scroll to rest
            exactly on a beat, never between two. */}
				{BEATS.map((_, i) => (
					<div
						key={`snap-${i}`}
						aria-hidden
						className="pointer-events-none absolute left-0 h-px w-px"
						style={{
							top: `${i * GAP_VH}vh`,
							scrollSnapAlign: "start",
							scrollSnapStop: "always",
						}}
					/>
				))}

				<div className="sticky top-0 h-screen w-full overflow-hidden">
					{BEATS.map((beat, i) => (
						<BeatLayer key={i} beat={beat} index={i} progress={progress} />
					))}

					{/* Scroll progress bar. */}
					<div className="absolute bottom-0 left-0 z-50 h-0.5 w-full bg-transparent">
						<div
							className="h-full origin-left bg-primary"
							style={{
								transform: `scaleX(${progress / (BEATS.length - 1)})`,
							}}
						/>
					</div>
				</div>

				{showHint && <ScrollHint />}
			</div>
		</main>
	);
};

export default NotConnectedHome;
