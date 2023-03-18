import { FormEvent, useState } from "react";
import Head from "next/head";
import type { NextPage } from "next";
import { AddressInput } from "~~/components/scaffold-eth";

const CreateWallet: NextPage = () => {
  const [formFields, setFormFields] = useState([{ address: "" }]);
  const [minSignatures, setMinSignatures] = useState("");

  const handleFormChange = (addressValue: string, index: number) => {
    const data = [...formFields];
    data[index].address = addressValue;
    setFormFields(data);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formFields);
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
        <div className="bg-base-100 p-5 rounded-3xl lg:min-w-[25%] shadow-2xl mt-24">
          <h1 className="text-2xl text-primary font-bold text-center mb-4">Create Your Wallet</h1>
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
            <button className="btn-primary btn-md btn" onClick={addFields}>
              Add
            </button>
            <div className="flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent">
              <input
                className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                placeholder="Min number of signatures"
                value={minSignatures}
                onChange={e => setMinSignatures(e.target.value)}
              />
            </div>
            <button className="btn-primary btn-md btn" type="submit">
              Submit
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateWallet;
