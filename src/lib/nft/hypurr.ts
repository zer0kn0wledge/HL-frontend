// ============================================
// HypurrNFT Configuration
// ============================================

export const HYPURR_NFT_CONFIG = {
  // Contract deployed on HyperEVM
  contractAddress: "0x9125E2d6827a00B0f8330D6ef7BEF07730Bac685" as const,
  chainId: 999, // HyperEVM chain ID

  // ERC-721 standard ABI
  abi: [
    {
      inputs: [{ name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "tokenId", type: "uint256" }],
      name: "ownerOf",
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "owner", type: "address" },
        { name: "index", type: "uint256" },
      ],
      name: "tokenOfOwnerByIndex",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "tokenId", type: "uint256" }],
      name: "tokenURI",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const,

  // Collection info
  totalSupply: 4600,
  name: "Hypurr",
  symbol: "HYPURR",

  // Metadata base URL (placeholder - update with actual)
  metadataBaseUrl: "https://api.hypurr.xyz/metadata/",
  ipfsGateway: "https://ipfs.io/ipfs/",
};

// HypurrNFT metadata structure
export interface HypurrMetadata {
  tokenId: number;
  name: string;
  description?: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

// Fetch metadata for a specific token
export async function fetchHypurrMetadata(
  tokenId: number
): Promise<HypurrMetadata> {
  try {
    const metadataUrl = `${HYPURR_NFT_CONFIG.metadataBaseUrl}${tokenId}`;
    const response = await fetch(metadataUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform IPFS URLs to HTTP gateway URLs
    let imageUrl = data.image || "";
    if (imageUrl.startsWith("ipfs://")) {
      imageUrl = imageUrl.replace("ipfs://", HYPURR_NFT_CONFIG.ipfsGateway);
    }

    return {
      tokenId,
      name: data.name || `Hypurr #${tokenId}`,
      description: data.description,
      image: imageUrl,
      attributes: data.attributes || [],
    };
  } catch (error) {
    console.error(`Error fetching Hypurr metadata for token ${tokenId}:`, error);
    // Return placeholder on error
    return {
      tokenId,
      name: `Hypurr #${tokenId}`,
      image: "/placeholder-nft.png",
      attributes: [],
    };
  }
}

// OpenSea collection URL
export const HYPURR_OPENSEA_URL =
  "https://opensea.io/collection/hypurr-hyperevm";

// HypurrScan URL for viewing NFT
export function getHypurrScanUrl(tokenId: number): string {
  return `https://hypurrscan.io/token/${HYPURR_NFT_CONFIG.contractAddress}?a=${tokenId}`;
}
