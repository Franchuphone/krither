import RoleAreaGuard from "@/components/connection/RoleAreaGuard";
import Pauser from "@/components/dashboards/Pauser";

export default function PauserPage() {
	return (
		<RoleAreaGuard flag="isPauser">
			<Pauser />
		</RoleAreaGuard>
	);
}
