import RoleAreaGuard from "@/components/connection/RoleAreaGuard";
import Paymaster from "@/components/dashboards/Paymaster";

export default function PaymasterPage() {
	return (
		<RoleAreaGuard flag="isPaymaster">
			<Paymaster />
		</RoleAreaGuard>
	);
}
