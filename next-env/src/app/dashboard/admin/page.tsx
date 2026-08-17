import RoleAreaGuard from "@/components/connection/RoleAreaGuard";
import Admin from "@/components/dashboards/Admin";

export default function AdminPage() {
	return (
		<RoleAreaGuard flag="isAdmin">
			<Admin />
		</RoleAreaGuard>
	);
}
