"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { MusicShop__factory } from "@/typechain";
import type { MusicShop } from "@/typechain";
import type { BrowserProvider } from "ethers";
import ConnectWallet from "./components/ConnectWallet";
import WaitingForTransactionMessage from "./components/WaitingForTransactionMessage";
import TransactionErrorMessage from "./components/TransactionErrorMessage";

const HARDHAT_NETWORK_ID = "0x539";
const MUSIC_SHOP_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

declare let window: any;

type CurrentConnectionProps = {
  provider: BrowserProvider | undefined;
  shop: MusicShop | undefined;
  signer: ethers.JsonRpcSigner | undefined;
};

export default function Home() {
  const [currentConnection, setCurrentConnection] =
    useState<CurrentConnectionProps>();
  const [networkError, setNetworkError] = useState<string>();
  const [txBeingSent, setTxBeingSent] = useState<string>();
  const [transactionError, setTransactionError] = useState<any>();
  const _dismissNetworkError = () => {
    setNetworkError(undefined);
  };
  const _dismissTransactionError = () => {
    setTransactionError(undefined);
  };
  const _getRpcErrorMessage = (error: any): string => {
    console.error(error);
    if (error.data) {
      return error.data.message;
    }
    return error.message;
  };
  const _checkNetwork = async (): Promise<boolean> => {
    const chosenChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    if (chosenChainId === HARDHAT_NETWORK_ID) {
      return true;
    }

    setNetworkError("Please connect to Hardhat network!");

    return false;
  };
  const _initialize = async (selectedAccount: string) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner(selectedAccount);

    setCurrentConnection({
      ...currentConnection,
      provider,
      signer,
      shop: MusicShop__factory.connect(MUSIC_SHOP_ADDRESS, signer),
    });
  };
  const _resetState = () => {
    setNetworkError(undefined);
    setTransactionError(undefined);
    setTxBeingSent(undefined);
    setCurrentConnection({
      provider: undefined,
      shop: undefined,
      signer: undefined,
    });
  };
  const _connectWallet = async () => {
    if (window.ethereum === undefined) {
      setNetworkError("Please install web3 wallet!");
      return;
    }

    if (!(await _checkNetwork())) {
      return;
    }

    const [selectedAccount] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    await _initialize(selectedAccount);

    window.ethereum.on(
      "accountsChanged",
      async ([newAccount]: [newAccount: string]) => {
        if (newAccount === undefined) {
          return _resetState();
        }

        await _initialize(newAccount);
      },
    );

    window.ethereum.on("chainChanged", ([_networkId]: any) => {
      _resetState();
    });
  };

  return (
    <main>
      {!currentConnection?.signer && (
        <ConnectWallet
          connectWallet={_connectWallet}
          networkError={networkError}
          dismiss={_dismissNetworkError}
        />
      )}

      {currentConnection?.signer && (
        <p>Your address: {currentConnection.signer.address}</p>
      )}

      {txBeingSent && <WaitingForTransactionMessage txHash={txBeingSent} />}

      {transactionError && (
        <TransactionErrorMessage
          message={_getRpcErrorMessage(transactionError)}
          dismiss={_dismissTransactionError}
        />
      )}
    </main>
  );
}
