import { Alert, AlertTitle } from "@/components/ui/alert";
import { Loader2Icon } from "lucide-react";

const LoadingAlert = ({ text }: { text: string }) => {
	return (
		<Alert className="m-auto w-fit p-6">
			<Loader2Icon className="size-10 animate-spin" />
			<AlertTitle className="text-2xl">{text}</AlertTitle>
		</Alert>
	);
};

export default LoadingAlert;
