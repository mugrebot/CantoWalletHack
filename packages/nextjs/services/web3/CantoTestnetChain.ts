import { Chain } from "wagmi";

export const cantoTestnet: Chain = {
  id: 7701,
  name: "Canto-Testnet",
  network: "cantoTestnet",
  nativeCurrency: {
    decimals: 18,
    name: "CANTO",
    symbol: "CANTO",
  },
  rpcUrls: {
    public: { http: ["https://canto-testnet.plexnode.wtf"] },
    default: { http: ["https://canto-testnet.plexnode.wtf"] },
  },
  blockExplorers: {
    etherscan: { name: "Tuber", url: "https://testnet.tuber.build/" },
    default: { name: "Tuber", url: "https://testnet.tuber.build/" },
  },
} as const;
