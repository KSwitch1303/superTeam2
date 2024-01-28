// Import the necessary packages
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code'; // You can use any QR code library
import { Keypair, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { encodeURL, validateTransfer, findReference } from '@solana/pay';
import { BigNumber } from 'bignumber.js';
import { useWallet } from '@solana/wallet-adapter-react';
// Define some constants
// const network = clusterApiUrl("devnet")

const network = WalletAdapterNetwork.Devnet
const endpoint = clusterApiUrl(network)
const connection = new Connection(endpoint)

const recipient = new PublicKey('DtjJAembjiCEeH9QmtoiYtDWunFZAsmFVQSZ29CbRadV'); // Replace with your own address
const amount = new BigNumber(0.1); // The amount of SOL to request
const label = 'Your Store Name'; // The label to display on the QR code
const message = 'Thank you for your purchase!'; // The message to display on the QR code
const memo = 'Your Order ID'; // The memo to attach to the transaction
// const connection = new Connection(network)
// Custom hook to generate a unique reference for each payment request
const useReference = () => {
  const [reference, setReference] = useState<PublicKey | null>(null);

  useEffect(() => {
    // Generate a new keypair and use the public key as the reference
    const keypair = Keypair.generate();
    setReference(keypair.publicKey);
  }, []);

  return reference;
};

// Define a component to render the QR code
const Home = () => {
  const { publicKey } = useWallet();
  const [con, setCon] = useState(false)
  const reference = useReference(); // Get the reference from the hook
  const [url, setUrl] = useState<string | null>(null); // The URL to encode in the QR code
  useEffect(() => {
    if (!publicKey){
      setUrl(null)
    } else {
      validate()
    }
  }, [con]);

  const validate = async () => { 
    if (reference && con) {
      // Generate the URL using the Solana Pay library
      const urlParams = {
        recipient,
        amount,
        reference,
        label,
        message,
        memo,
      };
      const solanaUrl = encodeURL(urlParams);
      setUrl(solanaUrl.href); // Set the URL state
      try {
        // Check if there is any transaction for the reference
          const signatureInfo = await findReference(connection, reference, { finality: 'confirmed' })
        // Validate that the transaction has the expected recipient, amount and SPL token
        await validateTransfer(
          connection,
          signatureInfo.signature,
          {
            recipient,
            amount,
            reference,
          },
          { commitment: 'confirmed' }
        )
        // alert('Success!')
        console.log('done');
      } catch (e) {
        console.log(e)
      }
    }
    
  }
 
  return (
    <div>
      <div>
        <button onClick={() => setCon(true)}>
          Validate
        </button>
      </div>
      {url ? (
        // Render the QR code using the URL
        <QRCode className='qr' value={url} size={500} />
      ) : (
        // Render a loading message while the URL is being generated
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Home;
