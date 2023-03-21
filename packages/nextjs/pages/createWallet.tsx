import { FormEvent, useState } from "react";
import Head from "next/head";
import type { NextPage } from "next";
import { AddressInput, UNSIGNED_NUMBER_REGEX } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const CreateWallet: NextPage = () => {
  const [formFields, setFormFields] = useState([{ address: "" }]);
  const [minSignatures, setMinSignatures] = useState("");
  const [walletName, setWalletName] = useState("");
  const [walletBalance, setWalletBalance] = useState("");

  // TODO : Check why its not working ? Maybe something wrong with contract?
  const { writeAsync, isLoading } = useScaffoldContractWrite("MultiSigFactory", "create2", [
    formFields.map(field => field.address),
    minSignatures,
    walletName,
  ]);

  const handleFormChange = (addressValue: string, index: number) => {
    const data = [...formFields];
    data[index].address = addressValue;
    setFormFields(data);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("⚡️ ~ file: createWallet.tsx:28 ~ submit ~ preparedData:", [
      formFields.map(field => field.address),
      UNSIGNED_NUMBER_REGEX.test(minSignatures) ? minSignatures : "1",
      walletName,
    ]);
    await writeAsync();
  };

  const addFields = () => {
    const object = {
      address: "",
    };

    setFormFields([...formFields, object]);
  };

  const removeFields = (index: number) => {
    const data = [...formFields];
    data.splice(index, 1);
    setFormFields(data);
  };
  return (
    <>
      <Head>
        <title>Create Wallet</title>
        <meta name="description" content="Created with 🏗 scaffold-eth" />
      </Head>
      <div className="flex items-center justify-center px-8">
        <div className="bg-base-100 p-5 rounded-3xl lg:min-w-[25%] shadow-2xl mt-12">
          <h1 className="text-2xl font-semibold text-center mb-4">Create Your Wallet</h1>
          <form onSubmit={submit} className="flex flex-col space-y-5">
            {formFields.map((form, index) => {
              return (
                <div key={index} className="flex space-x-4 items-center justify-between flex-wrap">
                  <div className="flex-1">
                    <AddressInput
                      name="address"
                      placeholder="address"
                      onChange={value => handleFormChange(value, index)}
                      value={form.address}
                    />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => removeFields(index)} disabled={index === 0}>
                    Remove
                  </button>
                </div>
              );
            })}
            <button className="btn-primary btn-md btn" type="button" onClick={addFields}>
              Add
            </button>
            <div className="flex flex-col">
              <p className="font-semibold mt-0 ml-1">Min Number of Signature</p>
              <div className="flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent">
                <input
                  className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                  placeholder="Min number of signatures"
                  value={minSignatures}
                  onChange={e => setMinSignatures(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <p className="font-semibold mt-0 ml-1">Name of the wallet</p>
              <div className="flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent">
                <input
                  className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                  placeholder="Name of the wallet"
                  value={walletName}
                  onChange={e => setWalletName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <p className="font-semibold mt-0 ml-1">Balance of wallet</p>
              <div className="flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent">
                <input
                  className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                  placeholder="Initial balance of the wallet"
                  value={walletBalance}
                  onChange={e => setWalletBalance(e.target.value)}
                />
              </div>
            </div>
            <button className={`btn-primary btn-md btn ${isLoading}`} disabled={isLoading} type="submit">
              Submit
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateWallet;
