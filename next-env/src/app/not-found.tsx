import { CompassIcon } from "lucide-react";
import HomeButton from "@/components/reusable/HomeButton";
import StatusScreen from "@/components/reusable/StatusScreen";

export default function NotFound() {
	return (
		<StatusScreen
			icon={CompassIcon}
			title="Page introuvable"
			description={
				<>
					Cette adresse ne correspond à aucune page. <br />
					Elle a peut-être été déplacée, ou le lien est incomplet.
				</>
			}
		>
			<HomeButton />
		</StatusScreen>
	);
}
