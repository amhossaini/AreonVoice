import WalletConnect from "@walletconnect/client";
import { convertUtf8ToHex } from "@walletconnect/utils"
import QRCodeModal from "@walletconnect/qrcode-modal";
import { useEffect, useRef, useState } from "react";
import '../Styles/HandellWallet.css';
import { chains } from '../constans/chaine.js';
import { ethers } from "ethers";
import { handelGetNonce, loginWithPublicKey, selectAPI, sendTxId } from "../features/cryptoVoice/cryptoVoiceSlice";
import { useDispatch, useSelector } from "react-redux";
// Create a connector
const connector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org", // Required
    qrcodeModal: QRCodeModal,
});
export default function HandelWallet(props) {
    const [account, setAccount] = useState();
    const [chainId, setChainId] = useState();
    const [hasmetamask, setHasMetamask] = useState();
    const [userOpenModal, setUserOpenModal] = useState(false);
    const [walletIcon, setWalletIcon] = useState();
    const [activeWallet, setActiveWallet] = useState();
    const mounted = useRef(true);
    const [statusConnection, setStatusConnection] = useState({ status: "", message: "" });
    const [statusAction, setStatusAction] = useState({ status: "", message: "" });
    const [audioDuring, setAudioDuring] = useState();
    const [isPlaying, setIsPlaying] = useState(false);
    const [toAddress, setToAddress] = useState("");
    const [amount, setAmount] = useState('0');
    const getNonceAPI = useSelector(selectAPI).getNonce;
    const dispatch = useDispatch();
    const callGetNonce = useRef(false);
    const callLogin = useRef(false);
    const [txHash, setTxHash] = useState("");
    const sendTxIdAPI = useSelector(selectAPI).sendTxId;


    const signWallet = async (message) => {
        setStatusAction({ status: "loading", message: "plase sign in your wallet app" })
        if (activeWallet.provider === "walletConnect") {
            const msgParams = [
                convertUtf8ToHex(message), // Required
                account, // Required
            ];

            // Sign personal message
            connector
                .signPersonalMessage(msgParams)
                .then((result) => {
                    // Returns signature.
                    dispatch(loginWithPublicKey({ signature: result, ethereumAddress: account }));
                    setStatusAction({ status: "idle", message: "sigend wallet successfull" })
                })
                .catch((error) => {
                    // Error returned when rejected
                    console.error(error);
                });
        };
        if (activeWallet.provider === "metamask") {
            await window.ethereum.send("eth_requestAccounts");
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const signature = await signer.signMessage(message);
            const address = await signer.getAddress();
            const response = { message: message, signature: signature, address: address }
            dispatch(loginWithPublicKey({ signature: signature, ethereumAddress: account }));
            setStatusAction({ status: "idle", message: "sigend wallet successfull" })
            return response;
        }

    };
    // useEfect for get Nonce
    useEffect(() => {
        if (account && !callGetNonce.current) {
            console.log("useEfect getnoone")
            dispatch(handelGetNonce(account));
            callGetNonce.current = true;
        }
    }, [callGetNonce.current, account])
    //useEfect for call Loginewith Publickey
    useEffect(() => {
        if (getNonceAPI.Status === "idle" && !callLogin.current && account) {
            var nonce = getNonceAPI.nonce;
            callLogin.current = true;
            signWallet(nonce);
        }

    }, [getNonceAPI, callLogin.current, account])

    //useEfect for user has metamask extention or no
    useEffect(() => {
        if (window.ethereum) {
            setHasMetamask(true);
        }
    }, []);
    // useEffect for clear localstoreg and get new connection walletconnect
    useEffect(() => {
        var StoregOfWalletConnect = localStorage.getItem('walletconnect');
        if (mounted.current && StoregOfWalletConnect) {
            connector.killSession();
        };
        return () => mounted.current = false;
    }, [])
    const handelConnect = (item) => {
        if (item === "metamask") {
            var StoregOfWalletConnect = localStorage.getItem('walletconnect');
            if (StoregOfWalletConnect) {
                connector.killSession();
            }
            const promise = new Promise((resolve, reject) => {
                var metamaskAccounts = window.ethereum.request({ method: 'eth_requestAccounts' });
                setStatusConnection({ status: "loading", message: "Confirm Metamask connection" });
                resolve(metamaskAccounts);
                reject((err) => err);
            });
            promise.then(
                (response) => {
                    setActiveWallet({ provider: "metamask", wallet: "Metamask Extention" });
                    setAccount(response[0].toLowerCase());
                    localStorage.setItem("address", response[0].toLowerCase())
                    setChainId(window.ethereum.networkVersion);
                    setWalletIcon("/icon/metamask.webp");
                    setStatusConnection({ status: "idle", message: "Metamask connected" })
                },
                (error) => { setStatusConnection({ status: "rejected", message: error.message }) }
            );
        }
        if (item === "walletConnect") {
            if (!connector.connected) {
                connector.createSession();
                if (userOpenModal) {
                    QRCodeModal.open(connector.uri, connector._qrcodeModalOptions);
                } else {
                    setUserOpenModal(true);
                }

            }

        }
    };
    const handelDisconnect = () => {
        if (activeWallet) {
            if (activeWallet.provider === "walletConnect") {
                connector.killSession();
                setActiveWallet();
                setUserOpenModal(false);
            };
            if (activeWallet.provider === "metamask") {
                // connector.killSession();
                setActiveWallet();
                setUserOpenModal(false);
            };
            setAccount();
            localStorage.setItem("address", "");
            callLogin.current = false;
            callGetNonce.current = false;
            setChainId();
            setWalletIcon();
            setStatusConnection({ status: "", message: "" });
        }
    }

    connector.on("connect", (error, payload) => {
        if (error) {
            throw error;
        }
        // Get provided accounts and chainId
        const { accounts, chainId } = payload.params[0];
        setAccount(accounts[0].toLowerCase());
        localStorage.setItem("address", accounts[0].toLowerCase())
        setChainId(chainId);
        setWalletIcon(payload.params[0].peerMeta.icons[0]);
        setActiveWallet({ provider: "walletConnect", wallet: payload.params[0].peerMeta.description });
        setStatusConnection({ status: "idle", message: payload.params[0].peerMeta.description + "is connected" });
        QRCodeModal.close();
    });

    connector.on("session_update", (error, payload) => {
        if (error) {
            throw error;
        }

        // Get updated accounts and chainId
        const { accounts, chainId } = payload.params[0];
        setAccount(accounts[0].toLowerCase());
        localStorage.setItem("address", accounts[0].toLowerCase())
        setChainId(chainId);
    });

    connector.on("disconnect", (error, payload) => {
        if (error) {
            throw error;
        }
        handelDisconnect();
    });
    if (hasmetamask) {
        window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0].toLowerCase())
            localStorage.setItem("address", accounts[0].toLowerCase())

        });

        window.ethereum.on('chainChanged', (chainId) => {
            setChainId(parseInt(chainId.toString().substring(2), 16));
        });
        window.ethereum.on('disconnect', () => {
            handelDisconnect();
        });
    }
    // forsendTxiD
    const handelSendTxId = (txId) => {
        var token = localStorage.getItem("token");
        dispatch(sendTxId({ token: token, body: { from: account, to: toAddress.toLowerCase(), chainId: chainId, transactionHash: txId } }))
    }
    //metamask send transaction
    const metamaskSend = (params) => {
        window.ethereum
            .request({
                method: 'eth_sendTransaction',
                params: [
                    params,
                ],
            })
            .then((txHash) => { setTxHash(txHash); handelSendTxId(txHash) })
            .catch((error) => console.log(error));
    }
    //Walletconnect send transAction
    const walletConnectSend = (params) => {
        var token = localStorage.getItem("token");
        connector
            .sendTransaction(params)
            .then((txHash) => {
                // Returns transaction id (hash)
                setTxHash(txHash)
                handelSendTxId(txHash)
            })
            .catch((error) => {
                // Error returned when rejected
                console.error(error);
            });
    }
    //handel sending transaction 
    const handelSendTransAction = () => {
        var patternAddress = /^0x[a-fA-F0-9]{40}$/;
        var trustAddress = patternAddress.test(toAddress);
        if (!toAddress || !trustAddress) {
            document.getElementById('actionTable').classList.add("requaredFild");
            if (!trustAddress) { setStatusAction({ status: "notFiled", message: "Sending address is not Valid" }) }
        } else {
            setStatusAction({ status: "", message: "" });
            var params = {
                from: account,
                to: toAddress,
                value: ethers.utils.parseEther(amount)._hex,
                data: props.hexFile,
                // chainId: '0x1'//chainId, // Used to prevent transac
            }
            if (activeWallet.provider === "metamask") {
                metamaskSend(params);
            };
            if (activeWallet.provider === "walletConnect") {
                walletConnectSend(params);
            };
        }
    }

    return (
        <>
            {props.showModalWallet
                &&
                <div className="walletModal">
                    <div className="walletModalmain col-12 col-sm-10 ">
                        <div className="row h-100 flex-wrap-reverse">
                            <div className=" walletmodalStatus col-md-5">
                                <div className="status">
                                    {
                                        activeWallet
                                            ? <h6 className="text-center text-light mb-3">{activeWallet.wallet}</h6>
                                            : <h6 className="text-center text-light mb-3">Wallet is not Connected</h6>
                                    }
                                    <div className="statusConect">
                                        <span><img src="favicon.ico" alt="" /></span>
                                        <div className={statusAction.status === "loading" ?"circle360 icon fs-1 text-white":"icon fs-1 text-white"}>{activeWallet ? "link" : "link_off"}</div>
                                    {
                                        walletIcon
                                            ? <span><img src={walletIcon} alt="" /></span>
                                            : <span className="icon">account_balance_wallet</span>
                                    }
                                </div>
                                {
                                    statusAction.status === "loading" && <strong className="text-light">{statusAction.message}</strong>
                                }
                                {
                                    (activeWallet && props.showModalWallet === "wallet")
                                    &&
                                    <div className="statusInfo">
                                        <div>
                                            <p>Your Account:</p>
                                            <div className="d-flex align-items-center">
                                                <strong>{account.substring(0, 12) + " . . . " + account.substring(account.length - 8, account.length)}</strong>
                                                <i className='icon ms-2 fs-3' onClick={() => navigator.clipboard.writeText(account)} title="copy address">copy</i>
                                            </div>
                                        </div>
                                        <div>
                                            {
                                                chains[chainId]
                                                    ?
                                                    <>
                                                        <p>Active network:</p>
                                                        <strong>{chains[chainId].name}</strong>
                                                    </>
                                                    :
                                                    <>
                                                        <p>Active chainId:</p>
                                                        <strong>{chainId}</strong>
                                                    </>
                                            }
                                        </div>
                                    </div>
                                }
                                {
                                    props.showModalWallet === "action"
                                    &&
                                    <>
                                        <div className="actionWallet">
                                            <img src="/icon/sendVoice.png" alt="" />
                                        </div>
                                        <h6>Send Voice to Areon</h6>
                                    </>
                                }
                            </div>
                        </div>
                        <div className="col-md-7 d-flex flex-column justify-content-between ">
                            <div className="walletModalHeader">
                                {
                                    activeWallet
                                        ? <h6 className="m-0"><strong>{activeWallet.wallet}</strong> is connected</h6>
                                        : <h6 className="m-0">Select Wallet</h6>
                                }
                                <span className="icon fs-4" style={{ cursor: "pointer" }} onClick={() => props.setShowModalWallet(false)}>close</span>
                            </div>
                            {
                                (activeWallet && props.showModalWallet === "wallet")
                                && <>
                                    <div>
                                        <div className="connectWallet w-100 py-4 px-2">
                                            <span><img src="favicon.ico" alt="" /></span>
                                            <span style={{ marginLeft: "-20px" }}><img src={walletIcon} alt="" /></span>
                                        </div>
                                    </div>
                                    <button className="btn-link fs-6 bg-white p-0 border-0 text-danger font-semi mx-auto mb-3 d-block" onClick={() => handelDisconnect()} >Disconnect Wallet</button>
                                </>
                            }
                            {
                                !activeWallet
                                &&
                                <div className="w-100  p-2">
                                    <button className="selectWallet" onClick={() => handelConnect("metamask")} disabled={!hasmetamask} >
                                        <span>Metamask Extention<small>{hasmetamask ? " (Recomended)" : <a href="https://metamask.io/download/" className="ms-1" target="_blank" rel="noopener noreferrer">Install Extention</a>}</small></span>
                                        <img src="/icon/metamask.webp" alt="metamask" />
                                    </button>
                                    <button className="selectWallet" onClick={() => handelConnect("walletConnect")} disabled={false}>
                                        <span>Wallet Connect</span>
                                        <img src="/icon/walletconnect.png" alt="metamask" />
                                    </button>
                                    <p className="mt-4 mb-3">Select Wallet and confirm it in your wallet App</p>
                                </div>
                            }
                            {
                                (activeWallet && props.showModalWallet === "action")
                                &&
                                <>
                                    <div className="w-100  p-2">
                                        <table id="actionTable" className="actionProps">
                                            <tbody>
                                                <tr>
                                                    <td>Network:</td>
                                                    <td><strong>{chains[chainId].name || chainId}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td>Amount:</td>
                                                    <td>
                                                        <input onChange={(e) => setAmount(e.target.value)} className="value" type="number" inputMode="numeric" placeholder="0.0" />
                                                        <strong>{chains[chainId].nativeCurrency.symbol || ""}</strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="3" className="text-center">
                                                        <small className="text-primary">To changing network use your app wallet</small>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>To:</td>
                                                    <td>
                                                        <input required className="address" onChange={(e) => setToAddress(e.target.value)} type="text" placeholder="address for send" />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="d-flex align-items-center">
                                                        <span>Voice:</span>
                                                        {
                                                            isPlaying
                                                                ?
                                                                <i onClick={() => { document.getElementById('idAudio').pause(); document.getElementById('idAudio').currentTime = 0; }} className="icon fs-1 ms-1 text-primary" style={{ cursor: "pointer" }}>stop_circle</i>
                                                                :
                                                                <i onClick={() => document.getElementById('idAudio').play()} className="icon fs-1 ms-1 text-primary" style={{ cursor: "pointer" }}>play_circle</i>
                                                        }
                                                        <audio id="idAudio" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onLoadedMetadata={(e) => setAudioDuring(e.target.duration)} src={props.voiceUrl} className="d-none" controls />
                                                    </td>
                                                    <td><strong>{audioDuring}s</strong></td>
                                                </tr>
                                                <tr>
                                                    <td>txHash:</td>
                                                    <td>
                                                        <div className="d-flex align-items-center ">
                                                            {/* {
                                                                    txHash !== ""
                                                                    &&
                                                                    <button className="btn btn-success" onClick={() => navigator.clipboard.writeText(txHash)}><span className="icon">copy</span>Copy TxId</button>
                                                                } */}
                                                            {
                                                                sendTxIdAPI.Status === "loading" && <div className="d-flex align-items-center"><span className="me-1">sending TxId</span><span className="loadingspan"></span></div>
                                                            }
                                                            {
                                                                sendTxIdAPI.Status === "idle" && <div className="d-flex align-items-center"><span className="me-1">TxId sent</span><span className="icon fs-4 text-primary">task_alt</span></div>
                                                            }
                                                            {
                                                                sendTxIdAPI.Status === "rejected" && <div className="d-flex align-items-center"><button className="me-1 btn btn-outline-danger" onClick={() => handelSendTxId(txHash)}>Resend TxId</button><span className="icon fs-4 text-danger">error</span></div>
                                                            }
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    {
                                        statusAction.status === "notFiled" && <small className="text-danger">{statusAction.message}</small>
                                    }
                                    <button className="btn btn-primary mx-auto d-block mb-2" onClick={() => handelSendTransAction()}>Send TransAction</button>
                                </>
                            }
                        </div>
                    </div>
                </div>
                </div>
            }
        </>
    )
}