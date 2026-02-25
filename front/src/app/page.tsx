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

export default function Home() {
  return <main></main>;
}


 