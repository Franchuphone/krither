const Detail = ({ label, value }: { label: string; value: string }) => (
	<div className="flex flex-col gap-0.5">
		<span className="text-xs tracking-kicker text-muted-foreground uppercase">
			{label}
		</span>
		<span className="text-sm break-all text-foreground">{value}</span>
	</div>
);

export default Detail;
