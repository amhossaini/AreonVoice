export const etherScanURL = (network) =>{
    var url ="";
    switch(network.toLowerCase()){
        case "areon testnet" :
            url="https://areonscan.com";
            break;
    }
    return url;
}