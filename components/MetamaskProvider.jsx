import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";

export const injected = new InjectedConnector({
  supportedNetworks: [1, 3, 4, 5, 42],
});

function MetamaskProvider({ children }) {
  const {
    active: networkActive,
    error: networkError,
    activate: activateNetwork,
    deactivate,
    library,
  } = useWeb3React();
  const [loaded, setLoaded] = useState(false);

  //   console.log({ connected });
  //   useEffect(() => {
  //     if (window) {
  //       connected = localStorage.getItem("connected");
  //     }
  //   }, []);
  useEffect(() => {
    if (window) {
      let disconnect = localStorage.getItem("disconnect");
      //   if (connected) {
      injected
        .isAuthorized()
        .then((isAuthorized) => {
          // console.log({ injected, isAuthorized, networkActive, networkError });
          setLoaded(true);
          if (isAuthorized && !networkActive && !networkError && !disconnect) {
            activateNetwork(injected);
          }
        })
        .catch(() => {
          setLoaded(true);
        });
    }
  }, [activateNetwork, networkActive, networkError]);
  if (loaded) {
    return children;
  }
  return <>Loading</>;
}

export default MetamaskProvider;
