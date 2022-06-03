import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";

import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { InjectedConnector } from "@web3-react/injected-connector";
import useSWR from "swr";
import { formatEther } from "ethers/lib/utils";

const fetcher =
  (library, abi) =>
  (...args) => {
    if (!library) return;

    const [arg1, arg2, ...params] = args;
    const address = arg1;
    const method = arg2;
    const contract = new Contract(address, abi, library);
    return contract[method](...params);
  };

const ETHBalance = () => {
  const { chainId, account, active, library } = useWeb3React();

  const { data: balance, mutate } = useSWR(["getBalance", account, "latest"], {
    fetcher: (...args) => {
      const [method, ...params] = args;
      return library[method](...params);
    },
  });

  useEffect(() => {
    if (!library) return;

    // listen for changes on an Ethereum address
    console.log(`listening for blocks...`);
    library.on("block", () => {
      // console.log("update balance...");
      mutate();
    });
    // remove listener when the component is unmounted
    return () => {
      library.removeAllListeners("block");
    };

    // trigger the effect only on component mount
    // ** changed to library prepared
  }, [library]);
  console.log({ balance, active });
  return (
    <div>
      {active && balance ? (
        <p>
          Eth in account: {parseFloat(formatEther(balance))}{" "}
          {chainId === 4 ? "Rinkeby" : ""} ETHG
        </p>
      ) : (
        <p>ETH in account: </p>
      )}
    </div>
  );
};

const JoinedWhitelisted = () => {
  const { library } = useWeb3React();
  const { data: numWhitelist, mutate } = useSWR(
    [WHITELIST_CONTRACT_ADDRESS, "numAddressesWhitelisted"],
    {
      fetcher: fetcher(library, abi),
    }
  );

  useEffect(() => {
    if (!library) return;

    // listen for changes on an Ethereum address
    console.log(`listening for blocks...`);
    library.on("block", () => {
      mutate();
    });
    // remove listener when the component is unmounted
    return () => {
      library.removeAllListeners("block");
    };

    // trigger the effect only on component mount
    // ** changed to library prepared
  }, [library]);

  if (!numWhitelist) {
    return <div>0</div>;
  }

  return <div>{numWhitelist}</div>;
};

const useWhitelistContract = () => {
  const { account, active, library } = useWeb3React();
  const WHITELIST_ABI = abi;

  const [accountWhiteListed, setAccountWhiteListed] = useState(false);
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(undefined);

  const [isJoiningWhitelist, setIsJoiningWhitelist] = useState(false);

  const handleJoinWhitelist = async () => {
    if (!library) return;
    setIsJoiningWhitelist(true);
    try {
      const signer = library.getSigner(account);
      const whitelistContract = await new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );

      const tx = await whitelistContract.addAddressToWhitelist();
      await tx.wait();
      await getNumberOfWhitelisted();
      setAccountWhiteListed(true);
      setIsJoiningWhitelist(false);
    } catch (e) {
      setAccountWhiteListed(false);
      setIsJoiningWhitelist(false);
    }
  };

  const checkIfAccountIsWhitelisted = async () => {
    if (!library) return;
    const signer = library.getSigner(account);
    const whitelistContract = await new Contract(
      WHITELIST_CONTRACT_ADDRESS,
      abi,
      library
    );

    // Get the address associated to the signer which is connected to  MetaMask
    const address = await signer.getAddress();
    // // call the whitelistedAddresses from the contract
    const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
      address
    );

    setAccountWhiteListed(_joinedWhitelist);
  };

  const getNumberOfWhitelisted = async () => {
    if (!library) return;
    const whitelistContract = new Contract(
      WHITELIST_CONTRACT_ADDRESS,
      abi,
      library
    );

    const numOfWhitelisted = await whitelistContract.numAddressesWhitelisted();

    setNumberOfWhitelisted(numOfWhitelisted);
  };

  useEffect(() => {
    if (!!library) {
      checkIfAccountIsWhitelisted();
      getNumberOfWhitelisted();
    } else {
      setAccountWhiteListed(false);
    }
  }, [active, library]);

  return {
    accountWhiteListed,
    handleJoinWhitelist,
    isJoiningWhitelist,
  };
};
export default function Home() {
  const injectedConnector = new InjectedConnector({
    supportedChainIds: [1, 3, 4, 5, 42, 1666700000],
  });
  const { chainId, account, activate, deactivate, active, library } =
    useWeb3React();
  const { accountWhiteListed, handleJoinWhitelist, isJoiningWhitelist } =
    useWhitelistContract();
  const onClick = () => {
    if (window) {
      localStorage.removeItem("disconnect");
    }
    activate(injectedConnector);
  };

  const onClickDeactivate = () => {
    if (window) {
      localStorage.setItem("disconnect", true);
    }
    deactivate();
  };

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            <b>
              <JoinedWhitelisted />
            </b>{" "}
            have already joined the Whitelist
          </div>

          <div className={styles.description}>
            <div>ChainId: {chainId}</div>
            <div>Account: {account}</div>
            <ETHBalance />
          </div>
          {active && !accountWhiteListed && (
            <button onClick={handleJoinWhitelist} className={styles.button}>
              Join Whitelist
            </button>
          )}
          {active && accountWhiteListed && (
            <button
              disabled
              className={styles.button}
              style={{ backgroundColor: "gray", cursor: "default" }}
            >
              Whitelist joined
            </button>
          )}
          {!active ? (
            <button onClick={onClick} className={styles.button}>
              Connect wallet
            </button>
          ) : (
            <button
              onClick={onClickDeactivate}
              className={styles.button}
              style={{
                backgroundColor: "red",
                marginLeft: "2rem",
              }}
            >
              Disconnect wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>
      <footer className={styles.footer}>Made with &#10084; by Migs</footer>
    </div>
  );
}
