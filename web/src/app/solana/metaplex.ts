import { Metaplex,  walletAdapterIdentity, toMetaplexFileFromBrowser } from "@metaplex-foundation/js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";

export async function mintWithMetaplexJs(
    connection: Connection,
    networkConfiguration: string, 
    wallet: WalletContextState,
    name: string,
    symbol: string,
    description: string,
    collection: PublicKey,
    image: File,
): Promise<[string, string]> {
    const metaplex = Metaplex.make(connection)
        .use(walletAdapterIdentity(wallet))
    const { uri } = await metaplex.nfts().uploadMetadata({
        name,
        symbol,
        description,
        image: await toMetaplexFileFromBrowser(image),
    });
    const { nft, response } = await metaplex.nfts().create({
        name,
        symbol,
        uri: uri,
        sellerFeeBasisPoints: 0,
        tokenOwner: wallet.publicKey || undefined,
        mintTokens: true,
        collection,
    });
    return [nft.address.toBase58(), response.signature];
}
