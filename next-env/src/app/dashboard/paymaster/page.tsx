import RoleAreaGuard from "@/components/connection/RoleAreaGuard";
import Paymaster from "@/components/dashboards/paymaster/Paymaster";

export default function PaymasterPage() {
	return (
		<RoleAreaGuard flag="isPaymaster">
			<Paymaster />
		</RoleAreaGuard>
	);
}
