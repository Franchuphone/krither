import { CirclePause, type LucideIcon } from "lucide-react";
import InfoCard from "@/components/reusable/InfoCard";

type PauseCardProps = {
	label: string;
	/** Undefined while the read is in flight. */
	paused?: boolean;
	/** Shown while the contract runs. */
	hint: string;
	/** Shown while the contract is paused. */
	pausedHint?: string;
	icon?: LucideIcon;
};

const PauseCard = ({
	label,
	paused,
	hint,
	pausedHint = "Toutes les écritures sont gelées",
	icon = CirclePause,
}: PauseCardProps) => (
	<InfoCard
		label={label}
		value={
			paused === undefined ? undefined
			: paused ? "En pause"
			: "Actif"
		}
		hint={paused ? pausedHint : hint}
		icon={icon}
		alert={paused}
	/>
);

export default PauseCard;
