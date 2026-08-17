import RoleAreaGuard from "@/components/connection/RoleAreaGuard";
import Producer from "@/components/dashboards/Producer";

export default function ProducerPage() {
	return (
		<RoleAreaGuard flag="isProducer">
			<Producer />
		</RoleAreaGuard>
	);
}
