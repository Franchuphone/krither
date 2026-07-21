"use client";

import { type ReactNode, useState } from "react";
import { useAppKit, useAppKitNetwork } from "@reown/appkit/react";
import { useConnection, useBalance } from "wagmi";
import { formatEther } from "viem";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const truncate = (addr?: string) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

// Wei -> ETH string, 4 decimals, no trailing zeros.
const formatEth = (wei: bigint) =>
  Number(formatEther(wei))
    .toFixed(4)
    .replace(/\.?0+$/, "");

export default function WalletButton() {
  const { address, isConnected } = useConnection();
  const { data: balance } = useBalance({ address });
  const { caipNetwork } = useAppKitNetwork();
  const [open, setOpen] = useState(false);

  if (!isConnected) {
    return <WalletButtonTemplate text="Connect wallet" size="lg" />;
  }

  // Network switcher (opens AppKit) + balance: a row on wide screens, stacked in
  // the dropdown on narrow.
  const details = (
    <>
      <WalletButtonTemplate
        text={caipNetwork?.name ?? "Network"}
        view="Networks"
      />
      {balance && (
        <WalletButtonTemplate text={`${formatEth(balance.value)} ${balance.symbol}`} />
      )}
    </>
  );

  return (
    <>
      {/* >=800px: full three-button row */}
      <div className="hidden items-center gap-2 min-[800px]:flex">
        {details}
        <WalletButtonTemplate text={truncate(address)} />
      </div>

      {/* <800px: single button that expands the rest on click */}
      <div className="relative min-[800px]:hidden">
        <Button
          size="lg"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="gap-1.5"
        >
          {truncate(address)}
          <ChevronDownIcon
            className={cn("transition-transform", open && "rotate-180")}
          />
        </Button>
        {open && (
          <>
            {/* click-away layer */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute top-full right-0 z-20 mt-2 flex flex-col items-end gap-2">
              {details}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function WalletButtonTemplate({
  text,
  className,
  size = "default",
  view,
}: {
  text: ReactNode;
  className?: string;
  size?: "default" | "lg";
  view?: "Account" | "Networks";
}) {
  const { open } = useAppKit();
  return (
    <Button
      size={size}
      onClick={() => open(view ? { view } : undefined)}
      className={cn("font-semibold", className)}
    >
      {text}
    </Button>
  );
}
