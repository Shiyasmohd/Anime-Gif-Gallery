import './App.css';
import { useEffect ,useState} from 'react/cjs/react.development';
import {Connection,PublicKey,clusterApiUrl} from '@solana/web3.js';
import {Program,Provider,web3} from '@project-serum/anchor'
import idl from './idl.json'
import kp from './keypair.json'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

const {SystemProgram,Keypair} = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
const opts ={
  preflightCommitment :"processed"
}

const TEST_GIFS = [
	'https://media.giphy.com/media/7MjDKQZF02mLS/giphy.gif',
	'https://media.giphy.com/media/11O5c9EfmZTyyA/giphy.gif',
	'https://media.giphy.com/media/3PxSmPCeQsVGUl2Q35/giphy.gif',
	'https://media.giphy.com/media/TdoiN7rZuGDJPs2rAS/giphy.gif',
	'https://media.giphy.com/media/TdoiN7rZuGDJPs2rAS/giphy.gif',
	'https://media.giphy.com/media/TdoiN7rZuGDJPs2rAS/giphy.gif',
]

const MainPage = () => {

  const [walletAddress,setWalletAddress] = useState(null);
  const [inputLink,setInputLink] = useState('');
  const [gifList,setGifList] = useState([]);

  const renderNotConnectedContainer = async () =>{
    try{
      const {solana} = window;

      if(solana){
        if(solana.isPhantom){
          console.log("Phantom Found");
          const response = await solana.connect({onlyIfTrusted : true});
          console.log("Connected with public key :", response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        }
      }else{
        alert('Phantom Not found')
      }
    }catch(error){
      console.error(error);
    }
  }

  const renderConnectedContainer = () => {

    if (gifList==null){
      return(
        <div className='connected-container'>
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }else{
      return(
      <div className="connected-container">
        <form onSubmit={(e)=>{
          e.preventDefault();
          sendGif();
        }}>
        <input type="text" placeholder="Enter GIF Link!" value={inputLink} onChange={(e)=>{setInputLink(e.target.value)}} /><br/>
        <button type="submit" className="cta-button submit-gif-button">Submit</button>
        </form>
        <div className="gif-grid">
          {gifList.map((item,index) => (
            <div className="gif-item" key={index}>
              <img src={item.gifLink}  />
            </div>
          ))}
        </div>
      </div>
    )
    }
  };

  const connectWallet = async() =>{
    const {solana} = window;

    if(solana){
      const response = await solana.connect();
      console.log("Connected with public key :", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  }

  const connectWalletBtn = () =>(
    <button className='cta-button connect-wallet-button' onClick={connectWallet}>Connect to Wallet</button>
  )
  

  useEffect(()=>{

    const onLoad = async () =>{
      await renderNotConnectedContainer();
    }
    window.addEventListener('load',onLoad);
    return ()=> window.removeEventListener('load',onLoad);
  },[]);

  const getGifList = async() =>{
    try{
      const provider = getProvider();
      const program = new Program(idl,programID,provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got account", account);
      setGifList(account.gifList);
    }catch(error){
      console.log("Error i giflist", error);
      setGifList(null);
    }
  }

  useEffect(()=>{
    if(walletAddress){
      console.log('fetching giflist');
      getGifList();
    }
  },[walletAddress])

  const sendGif = async () => {
    if (inputLink.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputLink('');
    console.log('Gif link:', inputLink);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputLink, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputLink)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createGifAccount = async() =>{
    try{
      const provider = getProvider();
      const program = new Program(idl,programID,provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts : {
          baseAccount : baseAccount.publicKey,
          user : provider.wallet.publicKey,
          systemProgram : SystemProgram.programId
        },
        signers:[baseAccount]
      })

      console.log("Created a new baseAccount w/ Address ", baseAccount.publicKey.toString());
      await getGifList();
    }catch(error){
      console.log("Error creating baseAccount : ",error)
    }
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 Anime GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && connectWalletBtn()}
          { walletAddress && renderConnectedContainer()}

        </div>
      </div>
    </div>
  );
};

export default MainPage;
