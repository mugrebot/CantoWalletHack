import Head from "next/head";
import type { NextPage } from "next";
import { QRCodeSVG } from "qrcode.react";
import { Address, Balance } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Scaffold-eth App</title>
        <meta name="description" content="Created with 🏗 scaffold-eth" />
      </Head>

      <div className="flex items-center justify-center px-8">
        <div className="bg-base-100 p-5 rounded-3xl shadow-2xl mt-24 px-10 py-10">
          <div className="flex space-x-2">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex flex-col items-center">
                <p className="my-0 text-xl font-bold text-primary">Balance</p>
                <Balance address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" className="text-xl" />
              </div>
              <QRCodeSVG value="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" />
              <div className="flex space-x-2">
                <p className="my-0 text-xl font-bold text-primary">Wallet Name : </p>
                <p className="my-0 font-semibold text-lg">My Sig</p>
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-2">
                <p className="my-0 font-bold text-primary text-xl">Signatures Required : </p>
                <p className="my-0 font-semibold text-lg">1</p>
              </div>
              <p className="text-primary font-bold text-center text-xl mt-0">Owners</p>
              <ul className="flex flex-col items-center space-y-2">
                <li>
                  <Address address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" />
                </li>
                <li>
                  <Address address="0x55b9CB0bCf56057010b9c471e7D42d60e1111EEa" />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
