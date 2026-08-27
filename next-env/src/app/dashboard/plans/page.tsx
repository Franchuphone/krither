import RoleAreaGuard from "@/components/connection/RoleAreaGuard";
import Plans from "@/components/dashboards/plans/Plans";

export default function PlansAdminPage() {
	return (
		<RoleAreaGuard flag="isPlansAdmin">
			<Plans />
		</RoleAreaGuard>
	);
}
