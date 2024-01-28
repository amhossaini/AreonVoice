import VoiceRecorder from "./Pages/VoiceRecorder";
import PlayList from "./Pages/playList";
import './Styles/Master.css';
import './Styles/App.css';
import { useEffect, useState } from "react";
import HandelWallet from "./component/HandelWallet";
import { useSelector } from "react-redux";
import { selectUser } from "./features/cryptoVoice/cryptoVoiceSlice";
import HandelPWA from "./component/HandelPWA";


function App() {
  const [activePage, setActivePage] = useState("recorder");
  const [showModalWallet, setShowModalWallet] = useState(false);
  const [hexFile, setHexFile] = useState();
  const [voiceUrl, setVoiceUrl] = useState();
  const isLogin = useSelector(selectUser).isLogin;
  const [positionX, setPositionX] = useState();
  const [showWelcom,setShowWelcom] = useState(true);


  useEffect(()=>{
    if(localStorage.dontShowWellcomMassage === "true"){
      setShowWelcom(false)
    }
  },[showWelcom])
  const setDontshow = (e)=>{
      localStorage.dontShowWellcomMassage = e ;
  }
  const handelStart = (e) => {
    document.getElementById("recorder").style.transition = "none"
    document.getElementById("playList").style.transition = "none"
  }
  const handelMove = (e) => {
    setPositionX(e.changedTouches[0].pageX);
    var distance;
    if (positionX) {
      distance = positionX - e.changedTouches[0].pageX;
    } else {
      distance = 0;
    }
    if ((activePage === "recorder" && distance > 0) || (activePage === "playList" && distance < 0)) {
      var recElm = document.getElementById("recorder")
      var playElm = document.getElementById("playList")
      var recorderX = window.getComputedStyle(recElm).transform.match(/matrix.*\((.+)\)/)[1].split(', ')[4];
      var value = recorderX - distance;
      recElm.style.transform = "translateX(" + value + "px)";
      playElm.style.transform = "translateX(" + value + "px)";
    }
  }
  const handelEnd = () => {
    setPositionX(null);
    var screenX = window.screen.width;
    var recElm = document.getElementById("recorder")
    var recorderX = window.getComputedStyle(recElm).transform.match(/matrix.*\((.+)\)/)[1].split(', ')[4];
    document.getElementById("recorder").style = null;
    document.getElementById("playList").style = null;
    if (activePage === "recorder" && recorderX < -50) {
      setActivePage("playList")
    };
    if (activePage === "playList" && recorderX > (50 - screenX)) {
      setActivePage("recorder")
    };
  }
  return (
    <>
      <div className="appContioner p-md-4">
        <div
          id="recorder"
          onTouchStart={(e) => handelStart(e)}
          onTouchMove={(e) => handelMove(e)}
          onTouchEnd={() => handelEnd()}
          className={activePage === "recorder" ? "recordPage  activePage" : " recordPage"}
        >
          <VoiceRecorder setActivePage={setActivePage} setShowModalWallet={setShowModalWallet} setHexFile={setHexFile} setVoiceUrl={setVoiceUrl} />
        </div>
        <div
          id="playList"
          onTouchStart={(e) => handelStart(e)}
          onTouchMove={(e) => handelMove(e)}
          onTouchEnd={() => handelEnd()}
          className={activePage === "playList" ? "playListPage activePage" : "playListPage"}>
          <PlayList setActivePage={setActivePage} setShowModalWallet={setShowModalWallet} />
        </div>
        <HandelWallet showModalWallet={showModalWallet} setShowModalWallet={setShowModalWallet} hexFile={hexFile} voiceUrl={voiceUrl} />
        
      </div>
      <HandelPWA />
      {/* modal for welcom allert */}
      {showWelcom &&
      <div className="walletModal">
        <div className="modal" id="ModalWelcom"shown-bs-modal="true"	 data-bs-backdrop="false" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-modal="true">
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content modalwelcom">
            <div className="modal-header">
              <h5 className="modal-title text-center " id="ModalwelcomLabel">Welcome to  Areon Voice ...</h5>
              <button type="button" className="text-primary icon btn fs-2 px-1 py-0" onClick={()=>setShowWelcom(false)}>close</button>
            </div>
            <div className="modal-body modal-dialog-scrollable">
              <strong className="mb-2 d-block">Using Areon Voice is simple as sending a transaction</strong>
              <ul className="m-0 ps-2" style={{listStyleType: "upper"}}>
              <li>1- Record and say your deepest feeling</li>
              <li>2- We optimze and compress your voice</li>
              <li>3- Put address of who you like</li>
              <li>4- Send it, Vollllla</li>
              </ul>
              <span className="mt-1 d-block">It will remain forever on blockchain and he/she can listen to it through their dashboard.</span>
              <br/>
              <span className="text-primary ">Note: You can try it on testnets too!</span>
            </div>
            <div className="d-flex flex-column align-items-center justify-content-start pb-2">
              {/* <div className="wellcomDontShow">
                <input type="checkbox" onChange={(e)=>setDontshow(e)}/>
                <small>dontshowMessage</small>
              </div> */}
              <button type="button" onClick={()=>{setShowWelcom(false);setDontshow(true)}} className="btn btn-primary mt-2 mx-auto" >OK</button>
            </div>
          </div>
        </div>
      </div>
      </div>}
    </>
  );
}

export default App;
