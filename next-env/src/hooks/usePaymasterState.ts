import { paymasterAddress } from "@/lib/paymaster";
import { useBalance } from "wagmi";

export function usePaymasterState() {
	const { data: balance } = useBalance({
		address: paymasterAddress,
		query: { enabled: !!paymasterAddress },
	});

	return { balance: balance?.value };
}
