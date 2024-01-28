// --- Lib ---
import BigNumber from 'bignumber.js';
import { useState, useRef, useEffect } from 'react';

// --- Solana Common ---
import {
  Keypair,
  PublicKey,
} from '@solana/web3.js';

// --- Solana Wallet Adapter ---
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
// import { useLocalStorage } from '@solana/wallet-adapter-react';

// --- Solana Pay ---
import {
  encodeURL,
  parseURL,
  createTransfer,
  createQR,
  findReference,
  validateTransfer,
} from '@solana/pay';
import type { TransferRequestURL } from '../types/parseURL';

// --- Metaplex ---

// import { amount } from '@metaplex-foundation/js';
// import { Button } from '@solana/wallet-adapter-react-ui/lib/types/Button';

export const PaymentPage = () => {
  const { connection } = useConnection();
  const [payValid, setPayValid] = useState(false)
  const [sent, setSent] = useState(false)

  // const connection = new Connection('', 'confirmed');
  const { publicKey, sendTransaction } = useWallet();
 

  const MERCHANT_WALLET = new PublicKey('GeZe6v1Xfz6ZufvZtBxzWhcSZziM1n6yfPDteNJ4efr1');
  const [valuePaymentLink, setPaymentLink] = useState<URL>();
  const qrRef = useRef<HTMLDivElement>(null); // Display QR Code
  let paymentStatus: string = '';

  const createPayment = async (amt: number, lab: string) => {
    if (!publicKey) throw new WalletNotConnectedError();

    console.log("Let's simulate a Solana Pay flow ... \n");

    console.log('1. ✅ Establish connection to the cluster');

    /**
     * Simulate a checkout experience
     *
     * Recommendation:
     * `amount` and `reference` should be created in a trusted environment (server).
     * The `reference` should be unique to a single customer session,
     * and will be used to find and validate the payment in the future.
     *
     * Read our [getting started guide](#getting-started) for more information on the parameters.
     */
    console.log('\n2. 🛍 Simulate a customer checkout \n');

    const amount    = new BigNumber(amt);
    const reference = new Keypair().publicKey;
    const label     = lab;
    const message   = 'Thank you for your purchase!';
    const memo      = 'metamar100';

    /**
     * Create a payment request link
     *
     * Solana Pay uses a standard URL scheme across wallets for native SOL and SPL Token payments.
     * Several parameters are encoded within the link representing an intent to collect payment from a customer.
     */
    console.log('3. 💰 Create a payment request link \n');

    const paymentUrl = encodeURL({
      recipient:  MERCHANT_WALLET,
      amount:     amount,
      reference:  reference,
      label:      label,
      message:    message,
      memo:       memo,
    });
    console.log('paymentUrl.href =>', paymentUrl.href);

    setPaymentLink(paymentUrl);
  }

  const payOnBrowser = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    /**
     * Simulate wallet interaction
     *
     * This is only for example purposes. This interaction will be handled by a wallet provider
     */
    console.log('4. 🔐 Simulate wallet interaction \n');

    /**
     * For example only
     *
     * The URL that triggers the wallet interaction; follows the Solana Pay URL scheme
     * The parameters needed to create the correct transaction is encoded within the URL
     */
    if(!valuePaymentLink) throw new Error('Undefined payment request link(URL)');
    const {
      recipient,
      amount,
      reference,
      memo
    }: TransferRequestURL = parseURL(valuePaymentLink) as TransferRequestURL;

    /**
     * Create the transaction with the parameters decoded from the URL
     */
    if(!amount) throw Error('Undefined amount');
    const tx = await createTransfer(
      connection, // connectiuon
      publicKey, // sender
      { recipient, amount, reference, memo }
    );
    console.log('tx =>', tx);

    /**
     * Send the transaction to the network
     */
    // sendAndConfirmTransaction(connection, tx, [MERCHANT_WALLET]); // If use your Keypair
    const signature = await sendTransaction(tx, connection);
    console.log('signature =>', signature);

    // Update payment status
    paymentStatus = 'pending';
    console.log('paymentStatus =>', paymentStatus);
    checkPaymentStatus()
  };

  const payOnQr = () => {
    
    // encode URL in QR code
    if(!valuePaymentLink) throw Error('Undefined payment request link(URL)');
    const qrCode = createQR(valuePaymentLink, 260); // Args: Payment URL, Size

    // append QR code to the element
    if(qrRef.current){
      qrRef.current.innerHTML = ''
      qrCode.append(qrRef.current)
      setSent(true)
    }
  };

  const checkPaymentStatus = async () => {
    /**
     * Wait for payment to be confirmed
     *
     * When a customer approves the payment request in their wallet, this transaction exists on-chain.
     * You can use any references encoded into the payment link to find the exact transaction on-chain.
     * Important to note that we can only find the transaction when it's **confirmed**
     */
    console.log('\n5. Find the transaction');

    /**
     * Retry until we find the transaction
     *
     * If a transaction with the given reference can't be found, the `findTransactionSignature`
     * function will throw an error. There are a few reasons why this could be a false negative:
     *
     * - Transaction is not yet confirmed
     * - Customer is yet to approve/complete the transaction
     *
     * You can implement a polling strategy to query for the transaction periodically.
     */
    if(!valuePaymentLink) throw Error('Undefined payment request link(URL)');
    const {
      amount,
      reference, // Type: PublicKey[] (array)
    }: TransferRequestURL = parseURL(valuePaymentLink) as TransferRequestURL;

    if(!reference) throw Error('Undefined Reference');
    console.log(reference);
    const signatureInfo = await findReference(
      connection,
      reference[0], // Type: PublicKey (not array). parseURL get PublicKey[] so it need to [0].
      { finality: 'confirmed' }
    );
    console.log('signatureInfo =>', signatureInfo);
    console.log('\n 🖌  Signature found: ', signatureInfo.signature);

    // Update payment status
    paymentStatus = 'confirmed';

    /**
     * Validate transaction
     *
     * Once the `findTransactionSignature` function returns a signature,
     * it confirms that a transaction with reference to this order has been recorded on-chain.
     *
     * `validateTransactionSignature` allows you to validate that the transaction signature
     * found matches the transaction that you expected.
     */
    console.log('\n6. 🔗 Validate transaction \n');

    if(!amount) throw Error('Undefined amount');
    try {
      const signature = signatureInfo.signature;
      await validateTransfer(
        connection,
        signature,
        { recipient: MERCHANT_WALLET, amount }
      );

      // Update payment status
      paymentStatus = 'validated';
      console.log('✅ Payment validated');
      setPayValid(false)
      setSent(false)
    } catch (error) {
      console.error('❌ Payment failed', error);
    }
  };
  useEffect(()=> {
    if (publicKey) {
      // createPayment()
    }
  },[publicKey,payValid,sent])
  const price = [1.2,3,1]
  
  return (
    <div>
      <div>
      </div>
      {publicKey && (
        <div>
        <div>
        {payValid && <div><button onClick={payOnBrowser}>Pay on Browser</button> <button onClick={payOnQr}>Pay on QR</button> </div>}
        &nbsp; or &nbsp; 
        { payValid && (<div ref={qrRef} /> )}
        
      </div>
      <div>
        { sent && <button onClick={checkPaymentStatus}>3. Check Payment Status</button>}
      </div>
      <div className="shop">
            <h1 className="title">Shop</h1>
            <button onClick={() => {
              createPayment(price[0],'Gray Shirt');
              setPayValid(true)
            }}>
              <div className="shopItem">
              
                <div className="shopItemImg">
                    <img src="../assets/c_formal_gray_shirt.png" alt="img" width={100}/>
                </div>
                <div className="shopItemInfo">
                  <h2 className="shopItemTitle">Gray Shirt</h2>
                    <p>A simple shirt</p>
                    <p>Price: ${price[0]}</p>
                </div>
              </div>
            </button>
            <button onClick={() => {
              createPayment(price[1], 'C Pant');
              setPayValid(true)
            }}>
              <div className="shopItem">
              
                <div className="shopItemImg">
                    <img src="../assets/c_pant_girl.png" alt="img" width={100}/>
                </div>
                <div className="shopItemInfo">
                  <h2 className="shopItemTitle">C Pant</h2>
                    <p>A simple shirt</p>
                    <p>Price: ${price[1]}</p>
                </div>
              </div>
            </button>
        </div>
      </div>
      
      )}
      
      
    </div>
  );
};