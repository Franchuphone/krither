"use client";

import WalletButton from "./WalletButton";

// Header account button. Always visible: disconnected shows "Connect wallet",
// connected shows the account/network/balance controls.
export default function HeaderConnectButton() {
  return <WalletButton />;
}
