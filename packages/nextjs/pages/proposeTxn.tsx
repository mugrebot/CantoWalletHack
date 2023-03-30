import { FormEvent, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { MultiSigDetails } from ".";
import axios from "axios";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useIsMounted } from "usehooks-ts";
import { useChainId, useSignMessage } from "wagmi";
import { Spinner } from "~~/components/Spinner";
import { Address, AddressInput, getParsedEthersError } from "~~/components/scaffold-eth";
import { useMultiSigWalletGetTransactionHash, useMultiSigWalletRecover } from "~~/generated/contractHooks";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { useAppStore } from "~~/services/store/store";
import { SERVER_URL } from "~~/utils/constants";
import { notification } from "~~/utils/scaffold-eth";

const NUMBER_REGEX = /^[0-9]+(\.[0-9]+)?$/;

const ProposeTxn: NextPage = () => {
  const isMounted = useIsMounted();
  const [customNonce, setCustomNonce] = useState("");
  const [valueToSent, setValueToSent] = useState("");

  const [toAddress, setToAddress] = useState("");
  const chainId = useChainId();

  const multiSigIds = useAppStore(state => state.multisigIds);

  const { data, isLoading: getMultiSigLoading } = useScaffoldContractRead<MultiSigDetails>(
    "MultiSigFactory",
    "getMultiSig",
    [multiSigIds[0]],
  );
  const { data: txnHash } = useMultiSigWalletGetTransactionHash({
    address: data?.multiSigAddress,
    args: [
      NUMBER_REGEX.test(customNonce) ? ethers.utils.parseEther(customNonce) : ethers.utils.parseEther("0"),
      toAddress,
      NUMBER_REGEX.test(valueToSent) ? ethers.utils.parseEther(valueToSent) : ethers.utils.parseEther("0"),
      "0x",
    ],
  });

  console.log("⚡️ ~ file: index.tsx: ~ Home ~ data", data?.multiSigAddress);

  const {
    data: signedMessage,
    isLoading: signingMessage,
    signMessageAsync,
  } = useSignMessage({
    message: txnHash ? ethers.utils.arrayify(txnHash) : undefined,
  });
  console.log("⚡️ ~ file: proposeTxn.tsx:60 ~ signedMessage:", signedMessage);

  const { data: recoveredMessage, isLoading: isLoadingRecoverdMessage } = useMultiSigWalletRecover({
    address: data?.multiSigAddress,
    args: txnHash && signedMessage ? [txnHash, signedMessage] : undefined,
  });
  console.log("⚡️ ~ file: proposeTxn.tsx:66 ~ recoveredMessage:", recoveredMessage);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let notiId = "";
    try {
      notiId = notification.loading("Proposing Transaction");
      const latestSignedMessage = await signMessageAsync();
      console.log("⚡️ ~ file: proposeTxn.tsx:79 ~ submit ~ latestRecoveredMessage:", recoveredMessage);
      await axios.post(`${SERVER_URL}/`, {
        chainId: chainId,
        address: data?.multiSigAddress,
        nonce: customNonce,
        to: toAddress,
        amount: valueToSent,
        data: "0x",
        hash: txnHash,
        signatures: [latestSignedMessage],
        signers: [recoveredMessage],
      });
      console.log("🚀 ~ file: index.tsx: ~ submit ~ res", {
        chainId: chainId,
        address: data?.multiSigAddress,
        nonce: customNonce,
        to: toAddress,
        amount: valueToSent,
        data: "0x",
        hash: txnHash,
        signatures: [signedMessage],
        signers: [recoveredMessage],
      });
      notification.success("Transaction Proposed Successfully");
    } catch (e) {
      notification.error(getParsedEthersError(e));
    } finally {
      notification.remove(notiId);
    }
  };

  if (!isMounted()) {
    return null;
  }
  return (
    <>
      <Head>
        <title>Propose Transaction</title>
        <meta name="description" content="Created with 🏗 scaffold-eth" />
      </Head>
      <div className="flex items-center justify-center px-8">
        {multiSigIds.length === 0 ? (
          <div>
            <p>No MultiSig Found</p>
            <Link href={"/createWallet"} className="btn btn-primary">
              Create Wallet
            </Link>
          </div>
        ) : getMultiSigLoading ? (
          <div className="ml-2">
            <Spinner width="50" height="50" />
          </div>
        ) : (
          <div className="bg-base-100 p-5 rounded-3xl lg:min-w-[25%] shadow-2xl mt-12">
            <h1 className="text-2xl font-semibold text-center mb-4">Send ETH</h1>
            <div className="flex justify-center w-full mb-4">
              <Address address={data?.multiSigAddress} />
            </div>
            <form onSubmit={submit} className="flex flex-col space-y-5">
              <div className="flex flex-col">
                <p className="font-semibold mt-0 ml-1">To Address</p>
                <div className="flex items-center  bg-base-200 rounded-full text-accent">
                  <div className="flex-1">
                    <AddressInput
                      name="address"
                      placeholder="address"
                      onChange={value => setToAddress(value)}
                      value={toAddress}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold mt-0 ml-1">Value to be sent</p>
                <div className="flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent">
                  <input
                    className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                    placeholder="Initial balance of the wallet"
                    value={valueToSent}
                    onChange={e => setValueToSent(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold mt-0 ml-1">Custom Nonce</p>
                <div className="flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent">
                  <input
                    className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                    placeholder="Initial balance of the wallet"
                    value={customNonce}
                    onChange={e => setCustomNonce(e.target.value)}
                  />
                </div>
              </div>
              <button
                className={`btn-primary btn-md btn ${signingMessage || isLoadingRecoverdMessage}`}
                disabled={signingMessage || isLoadingRecoverdMessage}
                type="submit"
              >
                Propose
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default ProposeTxn;
