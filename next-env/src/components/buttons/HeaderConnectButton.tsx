"use client";

import WalletButton from "./WalletButton";

// Header account button. Always visible: disconnected shows "Connect wallet",
// connected shows the account/network/balance controls.
const HeaderConnectButton = () => {
  return <WalletButton />;
};

export default HeaderConnectButton;
