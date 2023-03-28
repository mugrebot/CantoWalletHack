import Head from "next/head";
import Link from "next/link";
import { BigNumber } from "ethers";
import type { NextPage } from "next";
import { QRCodeSVG } from "qrcode.react";
import { Spinner } from "~~/components/Spinner";
import { Address, Balance } from "~~/components/scaffold-eth";
import { useMultiSigWalletGetMultiSigDetails } from "~~/generated/contractHooks";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { useAppStore } from "~~/services/store/store";

export type MultiSigDetails = {
  multiSigAddress: string;
  balance: BigNumber;
  signaturesRequired: BigNumber;
};

const Home: NextPage = () => {
  const multiSigIds = useAppStore(state => state.multisigIds);
  console.log("⚡️ ~ file: index.tsx:23 ~ multiSigIds:", multiSigIds);

  const { data, isLoading: getMultiSigLoading } = useScaffoldContractRead<MultiSigDetails>(
    "MultiSigFactory",
    "getMultiSig",
    [multiSigIds[0]],
  );
  console.log("⚡️ ~ file: index.tsx: ~ Home ~ data", data?.multiSigAddress);
  const { data: walletDetails, isLoading: walletDetailsLoading } = useMultiSigWalletGetMultiSigDetails({
    address: data?.multiSigAddress,
  });

  console.log("⚡️ ~ file: index.tsx: ~ Home ~ walletDetails", walletDetails);

  return (
    <>
      <Head>
        <title>Scaffold-eth App</title>
        <meta name="description" content="Created with 🏗 scaffold-eth" />
      </Head>

      <div className="flex items-center justify-center px-8">
        <div className="bg-base-100 p-5 rounded-3xl shadow-2xl mt-24 px-10 py-10">
          {multiSigIds.length === 0 ? (
            <div>
              <p>No MultiSig Found</p>
              <Link href={"/createWallet"} className="btn btn-primary">
                Create Wallet
              </Link>
            </div>
          ) : getMultiSigLoading || walletDetailsLoading ? (
            <div className="ml-2">
              <Spinner width="50" height="50" />
            </div>
          ) : (
            <div className="flex space-x-2">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex flex-col items-center">
                  <p className="my-0 text-xl font-bold text-primary">Balance</p>
                  <Balance address={data?.multiSigAddress} className="text-xl" />
                </div>
                <QRCodeSVG value="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" />
                <div className="flex space-x-2">
                  <p className="my-0 text-xl font-bold text-primary">Wallet Name : </p>
                  <p className="my-0 font-semibold text-lg">{walletDetails && walletDetails[0]}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-4">
                <div className="flex space-x-2">
                  <p className="my-0 font-bold text-primary text-xl">Signatures Required : </p>
                  <p className="my-0 font-semibold text-lg">{walletDetails && walletDetails[2].toString()}</p>
                </div>
                <p className="text-primary font-bold text-center text-xl mt-0">Owners</p>
                <ul className="flex flex-col items-center space-y-2">
                  {walletDetails &&
                    walletDetails[1].map((owner: string) => (
                      <li key={owner}>
                        <Address address={owner} />
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
