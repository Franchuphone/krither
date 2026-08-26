"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	isFieldValid,
	toArgument,
	type ContractField,
} from "@/lib/contractFields";
import { cn } from "@/lib/utils";

const ContractFieldInput = ({
	field,
	id,
	value,
	onChange,
	disabled,
}: {
	field: ContractField;
	id: string;
	value: string;
	onChange: (next: string) => void;
	disabled?: boolean;
}) => (
	<div
		className={cn(
			"flex flex-col gap-1.5",
			field.type === "string" && "sm:col-span-2",
		)}
	>
		<Label htmlFor={id} className="text-muted-foreground">
			{field.label}
		</Label>

		{field.type === "bool" ?
			<Switch
				id={id}
				checked={value === "true"}
				onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
				disabled={disabled}
				className="mt-1.5"
			/>
		: field.options ?
			<Select
				// null, not "", is what makes the placeholder show.
				value={value === "" ? null : value}
				onValueChange={(next) => onChange(String(next ?? ""))}
				disabled={disabled}
			>
				<SelectTrigger id={id} className="w-full">
					<SelectValue placeholder={field.placeholder ?? "Sélectionner"} />
				</SelectTrigger>
				<SelectContent>
					{field.options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		:	<Input
				id={id}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={field.placeholder}
				disabled={disabled}
				aria-invalid={value.length > 0 && !isFieldValid(field, value)}
				spellCheck={false}
			/>
		}

		{/* {(field.type === "ether" || field.type === "days") &&
			isFieldValid(field, value) && (
				<p className="text-xs text-muted-foreground tabular-nums">
					{toArgument(field, value).toString()}{" "}
					{field.type === "ether" ? "wei" : "secondes"}
				</p>
			)} */}
	</div>
);

export default ContractFieldInput;
