import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { DecoderOPUS } from '../../component/DecoerOPUS';
import { getOS } from '../../component/GetOs';
import { baseUrl } from '../../constans/appBase';
import {Web3} from 'web3';

const initialState = {
  user: {
    account: "",
    audio: {},
    isLogin: ""
  },
  API: {
    getTransActionData: {
      Status: {},
      err: {},
      data: {}
    },
    getTransActions: {
      Status: "",
      err: "",
      data: [],
      owner: ""
    },
    getNonce: {
      Status: "",
      error: "",
      nonce: ""
    },
    login: {
      Status: "",
      error: "",
      token: "",
    },
    sendTxId: {
      Status: "",
      error: "",
      message: "",
    },
  }
};

export const getTransActionData = createAsyncThunk(
  'cryptoVoice/fetchData',
  async (props) => {
    const W_HOST = 'https://testnet-rpc.areon.network'
    const web3 = new Web3(Web3.givenProvider || W_HOST);
    var tr = await web3.eth.getTransaction(props.txId);
    return tr.data;
  }
);
export const getNonce = createAsyncThunk(
  'cryptoVoice/getNonce',
  async (body) => {
    const response = await axios.post(baseUrl + "/user/getNonce",
      body
    )
    return response.data;
  }
);
export const loginWithPublicKey = createAsyncThunk(
  'cryptoVoice/login',
  async (body) => {
    const response = await axios.post(baseUrl + "/user/loginWithPublicKey",
      body
    )
    return response.data;
  }
);
export const sendTxId = createAsyncThunk(
  'cryptoVoice/sendTxId',
  async (props) => {
    const response = await axios.post(baseUrl + "/user/createTransaction",
      props.body,
      {
        headers: {
          'authtoken': props.token
        }
      }
    )
    return response.data;
  }
);
export const getTransActions = createAsyncThunk(
  'cryptoVoice/getTransActions',
  async (props) => {
    const response = await axios.get(baseUrl + "/user/getTransactions?type=" + props.type + "&page=" + props.page + "&pageSize=" + props.pageSize,
      {
        headers: {
          'authtoken': localStorage.getItem("token")
        }
      }
    )
    return response.data;
  }
);

export const cryptoVoiceSlice = createSlice({
  name: 'cryptoVoice',
  initialState,
  reducers: {
    setAudio: (state, action) => {
      state.user.audio = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTransActionData.pending, (state, action) => {
        state.API.getTransActionData.Status[action.meta.arg.txId] = 'loading';
        state.API.getTransActionData.err[action.meta.arg.txId] = [];
        state.API.getTransActionData.data[action.meta.arg.txId] = '';
      })
      .addCase(getTransActionData.fulfilled, (state, action) => {
        state.API.getTransActionData.Status[action.meta.arg.txId] = 'idle';
        state.API.getTransActionData.data[action.meta.arg.txId] = action.payload;
      })
      .addCase(getTransActionData.rejected, (state, action) => {
        state.API.getTransActionData.Status[action.meta.arg.txId] = 'rejected';
        state.API.getTransActionData.err[action.meta.arg.txId] = action.error;
      });
    builder
      .addCase(getNonce.pending, (state) => {
        state.API.getNonce.Status = 'loading';
        state.API.getNonce.error = '';
        state.API.getNonce.nonce = "";
      })
      .addCase(getNonce.fulfilled, (state, action) => {
        if (action.payload.hasError) {
          state.API.getNonce.Status = 'rejected';
          state.API.getNonce.error = action.payload.error;
        } else {
          state.API.getNonce.Status = 'idle';
          state.API.getNonce.nonce = action.payload.data.nonce;
        }
      })
      .addCase(getNonce.rejected, (state, action) => {
        state.API.getNonce.Status = 'rejected';
        state.API.getNonce.error = action.payload;
      });
    builder
      .addCase(loginWithPublicKey.pending, (state) => {
        state.API.login.Status = 'loading';
        state.API.login.error = '';
        state.API.login.message = '';
      })
      .addCase(loginWithPublicKey.fulfilled, (state, action) => {
        if (action.payload.hasError) {
          state.API.login.Status = 'rejected';
          state.API.login.error = action.payload.error.message;
          localStorage.clear();
        } else {
          state.API.login.Status = 'idle';
          state.API.login.token = action.payload.data.token;
          localStorage.setItem("token", action.payload.data.token);
          localStorage.setItem("tokenFor", action.payload.data.ethereumAddress.toLowerCase());
          state.user.isLogin = true;
        }
      })
      .addCase(loginWithPublicKey.rejected, (state, action) => {
        state.API.login.Status = 'rejected';
        state.API.login.error = action.payload;
        localStorage.clear();
        state.user.isLogin = false;
      });
    builder
      .addCase(sendTxId.pending, (state) => {
        state.API.sendTxId.Status = 'loading';
        state.API.sendTxId.error = '';
        state.API.sendTxId.message = "";
      })
      .addCase(sendTxId.fulfilled, (state, action) => {
        if (action.payload.hasError) {
          state.API.sendTxId.Status = 'rejected';
          state.API.sendTxId.error = action.payload.error;
        } else {
          state.API.sendTxId.Status = 'idle';
          state.API.sendTxId.message = action.payload.message;
          state.user.isLogin = true;
        }
      })
      .addCase(sendTxId.rejected, (state, action) => {
        state.API.sendTxId.Status = 'rejected';
        state.API.sendTxId.error = action.payload;
      });
    builder
      .addCase(getTransActions.pending, (state) => {
        state.API.getTransActions.Status = 'loading';
        state.API.getTransActions.err = '';
        state.API.getTransActions.data = "";
      })
      .addCase(getTransActions.fulfilled, (state, action) => {
        if (action.payload.hasError) {
          state.API.getTransActions.Status = 'rejected';
          state.API.getTransActions.err = action.payload.error;
        } else {
          state.API.getTransActions.Status = 'idle';
          state.API.getTransActions.data = action.payload.data.transactions;
          state.API.getTransActions.count = action.payload.data.count;
          state.API.getTransActions.owner = action.payload.data.owner;
          state.user.isLogin = true;
        }
      })
      .addCase(getTransActions.rejected, (state, action) => {
        state.API.getTransActions.Status = 'rejected';
        state.API.getTransActions.err = action.error.message;
        localStorage.clear();
        if (action.error.message) {
          state.user.isLogin = false;
        };
      });
  },
});

export const { setAudio, } = cryptoVoiceSlice.actions;

export const selectAPI = (state) => state.cryptoVoice.API;
export const selectUser = (state) => state.cryptoVoice.user;

export const handelgetAudio = (props) => async (dispatch, getState) => {
  await dispatch(getTransActionData(props));
  var StatusGetData = selectAPI(getState()).getTransActionData.Status[props.txId];
  if (StatusGetData === "idle") {
    var hexFile = selectAPI(getState()).getTransActionData.data[props.txId].substring(2);
    var arr = Buffer.from(hexFile, 'hex');
    var OS = getOS();
    var url =
      (OS === "MacOS" || OS === "iOS")
        ?
        await DecoderOPUS(new Uint8Array(arr)).then(
          (res) => {
            return (res)
          }
        )
        :
        URL.createObjectURL(new Blob([arr], { type: 'audio/ogg' }))
    localStorage.setItem(props.txId, url);
    var audioState = selectUser(getState()).audio;
    var audio = JSON.parse(JSON.stringify(audioState));
    var txId = props.txId;
    audio[txId] = url;
    dispatch(setAudio(audio));
  }
};
export const handelGetNonce = (ADDRESS) => async (dispatch, getState) => {
  var token = localStorage.getItem("token");
  var addr = localStorage.getItem("tokenFor");
  if (!token || addr !== ADDRESS.toLowerCase()) {
    var address = ADDRESS.toLowerCase();
    await dispatch(getNonce({ ethereumAddress: address }));
  }
}

export default cryptoVoiceSlice.reducer;
