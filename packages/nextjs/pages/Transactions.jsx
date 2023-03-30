import { useState } from "react";
import { TransactionListItem } from "../components/MultiSig/TransactionListItem";
import { TenderlySimulation } from "../components/TenderlySimulation";
import { parseEther } from "@ethersproject/units";
import { Button, Checkbox, List, Spin } from "antd";
import { useScaffoldEventSubscriber } from "../hooks/scaffold-eth";
import { ethers } from "ethers";
import { useThemeSwitcher } from "react-css-theme-switcher";

const axios = require("axios");

const DEBUG = false;

export default function Transactions({
  poolServerUrl,
  contractName,
  signaturesRequired,
  address,
  nonce,
  userSigner,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
  blockExplorer,
  gasPrice,
}) {
  const [transactions, setTransactions] = useState();
  const [selectedTx, setSelectedTx] = useState(new Map());

  useScaffoldEventSubscriber(() => {
    const getTransactions = async () => {
      const res = await axios.get(
        poolServerUrl + readContracts[contractName].address + "_" + localProvider._network.chainId,
      );

      console.log("backend stuff res", res.data);

      const newTransactions = [];
      for (const i in res.data) {
        console.log("backend stuff res.data[i]", res.data[i]);
        const thisNonce = ethers.BigNumber.from(res.data[i].nonce);
        if (thisNonce && nonce && thisNonce.gte(nonce)) {
          const validSignatures = [];
          for (const sig in res.data[i].signatures) {
            const signer = await readContracts[contractName].recover(res.data[i].hash, res.data[i].signatures[sig]);
            const isOwner = await readContracts[contractName].isOwner(signer);
            if (signer && isOwner) {
              validSignatures.push({ signer, signature: res.data[i].signatures[sig] });
            }
          }

          res.data[i].nonce = thisNonce;

          const update = { ...res.data[i], validSignatures };
          newTransactions.push(update);
        }
      }

      console.log("backend stuff newTransactions", newTransactions);

      setTransactions(newTransactions);
    };
    if (readContracts[contractName]) getTransactions();
  }, 3777);

  const getSortedSigList = async (allSigs, newHash) => {
    const sigList = [];
    for (const sig in allSigs) {
      const recover = await readContracts[contractName].recover(newHash, allSigs[sig]);
      sigList.push({ signature: allSigs[sig], signer: recover });
    }

    sigList.sort((a, b) => {
      return ethers.BigNumber.from(a.signer).sub(ethers.BigNumber.from(b.signer));
    });

    const finalSigList = [];
    const finalSigners = [];
    const used = {};
    for (const sig in sigList) {
      if (!used[sigList[sig].signature]) {
        finalSigList.push(sigList[sig].signature);
        finalSigners.push(sigList[sig].signer);
      }
      used[sigList[sig].signature] = true;
    }

    return [finalSigList, finalSigners];
  };

  if (!signaturesRequired) {
    return <Spin />;
  }

  return (
    <div
      //  style={{ maxWidth: 850, margin: "auto", marginTop: 32, marginBottom: 32 }}
      className="flex flex-col justify-center items-center w-full   "
    >
      <h1
        className={`p-2 mt-1 w-1/12   ${
          currentTheme === "light" ? "bg-gray-100 border-2" : "border border-gray-300"
        } rounded-xl text-md`}
      >
        #{nonce ? nonce.toNumber() : <Spin />}
      </h1>
      <div className="lg:w-screen lg:p-x-52    txListWidth">
        <List
          // bordered
          dataSource={transactions}
          renderItem={(item, index) => {
            const hasSigned = item.signers.indexOf(address) >= 0;
            const hasEnoughSignatures = item.signatures.length <= signaturesRequired.toNumber();

            return (
              <div className="border-2 rounded-2xl shadow-md mt-4">
                <TransactionListItem
                  item={item}
                  mainnetProvider={mainnetProvider}
                  blockExplorer={blockExplorer}
                  price={price}
                  readContracts={readContracts}
                  contractName={contractName}
                >
                  <div
                    // style={{ padding: 16 }}
                    className={`${
                      currentTheme === "light" ? "bg-gray-100" : ""
                    } border-2 rounded-2xl flex justify-center items-center `}
                  >
                    <div
                      // style={{ padding: 4 }}
                      className="w-14 "
                    >
                      {item.signatures.length}/{signaturesRequired.toNumber()} {hasSigned ? "✅" : ""}
                    </div>
                    <div className="w-full flex justify-between p-2">
                      <Button
                        type="secondary"
                        onClick={async () => {
                          const newHash = await readContracts[contractName].getTransactionHash(
                            item.nonce,
                            item.to,
                            parseEther("" + parseFloat(item.amount).toFixed(12)),
                            item.data,
                          );

                          const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));
                          const recover = await readContracts[contractName].recover(newHash, signature);
                          const isOwner = await readContracts[contractName].isOwner(recover);
                          if (isOwner) {
                            const [finalSigList, finalSigners] = await getSortedSigList(
                              [...item.signatures, signature],
                              newHash,
                            );

                            let obj = selectedTx.get(index) ? selectedTx.get(index) : {};

                            obj.finalSigList = finalSigList;
                            selectedTx.set(index, obj);
                            setSelectedTx(selectedTx);

                            const res = await axios.post(poolServerUrl, {
                              ...item,
                              signatures: finalSigList,
                              signers: finalSigners,
                            });
                          }
                        }}
                      >
                        Sign
                      </Button>
                      <Button
                        key={item.hash}
                        type={hasEnoughSignatures ? "primary" : "secondary"}
                        onClick={async () => {
                          console.log("EXEC");

                          const newHash = await readContracts[contractName].getTransactionHash(
                            item.nonce,
                            item.to,
                            parseEther("" + parseFloat(item.amount).toFixed(12)),
                            item.data,
                          );

                          const [finalSigList, finalSigners] = await getSortedSigList(item.signatures, newHash);

                          let finalGaslimit = 250000;

                          try {
                            // get estimate gas for a execute tx
                            let estimateGasLimit = await writeContracts[contractName].estimateGas.executeTransaction(
                              item.to,
                              parseEther("" + parseFloat(item.amount).toFixed(12)),
                              item.data,
                              finalSigList,
                            );
                            estimateGasLimit = await estimateGasLimit.toNumber();

                            console.log("estimateGasLimit", estimateGasLimit);

                            // add extra 100k gas limit
                            finalGaslimit = estimateGasLimit + 100000;
                          } catch (e) {
                            console.log("Failed to estimate gas");
                          }

                          tx(
                            writeContracts[contractName].executeTransaction(
                              item.to,
                              parseEther("" + parseFloat(item.amount).toFixed(12)),
                              item.data,
                              finalSigList,
                              { gasLimit: finalGaslimit, gasPrice },
                            ),
                            async update => {
                              if (update && (update.status === "confirmed" || update.status === 1)) {
                                try {
                                  const parsedData =
                                    item.data !== "0x"
                                      ? readContracts[contractName].interface.parseTransaction(item)
                                      : null;
                                  // get all existing owner list
                                  let ownnersCount = await readContracts[contractName].numberOfOwners();
                                  /**----------------------
                                   * update owners on api at add signer
                                   * ---------------------*/
                                  if (parsedData && ["addSigner", "removeSigner"].includes(parsedData.name)) {
                                    // let finalOwnerList = [parsedData.args.newSigner, ...item.signers];
                                    let ownerAddress = address;
                                    let contractAddress = readContracts[contractName].address;
                                    let owners = [];
                                    ownnersCount = ownnersCount.toString();
                                    for (let index = 0; index < +ownnersCount; index++) {
                                      let owner = await readContracts[contractName].owners(index);
                                      owners.push(owner);
                                    }
                                    let reqData = { owners: owners };
                                    const res = await axios.post(
                                      poolServerUrl + `updateOwners/${ownerAddress}/${contractAddress}`,
                                      reqData,
                                    );
                                    console.log("update owner response", res.data);
                                  }
                                } catch (error) {
                                  console.log(`🔴 Error`, error);
                                }
                              }
                            },
                          );
                        }}
                      >
                        Exec
                      </Button>
                      <Checkbox
                        onChange={async e => {
                          if (e.target.checked) {
                            const newHash = await readContracts[contractName].getTransactionHash(
                              item.nonce,
                              item.to,
                              parseEther("" + parseFloat(item.amount).toFixed(12)),
                              item.data,
                            );

                            const [finalSigList, finalSigners] = await getSortedSigList(item.signatures, newHash);
                            selectedTx.set(index, {
                              to: item.to,
                              value: parseEther("" + parseFloat(item.amount).toFixed(12)),
                              data: item.data,
                              finalSigList: finalSigList,
                            });
                            setSelectedTx(selectedTx);
                          } else {
                            selectedTx.delete(index);
                            setSelectedTx(selectedTx);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <TenderlySimulation
                    params={item}
                    address={address}
                    multiSigWallet={readContracts["MultiSigWallet"]}
                    signaturesRequired={signaturesRequired}
                  />
                </TransactionListItem>
              </div>
            );
          }}
        />
        <Button
          type="secondary"
          onClick={async () => {
            var tos = [];
            var values = [];
            var data = [];
            var sigs = [];

            for (let i = 0; i < selectedTx.size; i++) {
              if (selectedTx.has(i)) {
                tos.push(selectedTx.get(i).to);
                values.push(selectedTx.get(i).value);
                data.push(selectedTx.get(i).data);
                sigs.push(selectedTx.get(i).finalSigList);
              }
            }
            tx(writeContracts[contractName].executeBatch(tos, values, data, sigs));
          }}
        >
          Exec selected
        </Button>
      </div>
    </div>
  );
}
