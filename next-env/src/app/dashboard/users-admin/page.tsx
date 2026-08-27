import RoleAreaGuard from "@/components/connection/RoleAreaGuard";
import UsersAdmin from "@/components/dashboards/users-admin/UsersAdmin";

export default function UsersAdminPage() {
	return (
		<RoleAreaGuard flag="isUsersAdmin">
			<UsersAdmin />
		</RoleAreaGuard>
	);
}
