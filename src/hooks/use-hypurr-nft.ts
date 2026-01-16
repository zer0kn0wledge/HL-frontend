"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { useQueries } from "@tanstack/react-query";
import { HYPURR_NFT_CONFIG, fetchHypurrMetadata } from "@/lib/nft/hypurr";
import type { Address } from "viem";

// ============================================
// HypurrNFT Ownership Hook
// ============================================

export interface HypurrOwnership {
  hasNFT: boolean;
  balance: number;
  tokenIds: number[];
  loading: boolean;
  error: Error | null;
}

export function useHypurrNFTOwnership(address?: Address): HypurrOwnership {
  // Check balance first
  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useReadContract({
    address: HYPURR_NFT_CONFIG.contractAddress,
    abi: HYPURR_NFT_CONFIG.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: HYPURR_NFT_CONFIG.chainId,
    query: {
      enabled: !!address,
    },
  });

  const hasNFT = balance ? Number(balance) > 0 : false;
  const balanceNum = balance ? Number(balance) : 0;

  // If they have NFTs, get the token IDs (for PFP selection)
  const tokenIdCalls = useMemo(() => {
    if (!balance || !address || balanceNum === 0) return [];

    return Array.from({ length: balanceNum }, (_, i) => ({
      address: HYPURR_NFT_CONFIG.contractAddress as Address,
      abi: HYPURR_NFT_CONFIG.abi,
      functionName: "tokenOfOwnerByIndex" as const,
      args: [address, BigInt(i)] as const,
      chainId: HYPURR_NFT_CONFIG.chainId,
    }));
  }, [balance, address, balanceNum]);

  const { data: tokenIdResults, isLoading: tokenIdsLoading } = useReadContracts({
    contracts: tokenIdCalls,
    query: {
      enabled: tokenIdCalls.length > 0,
    },
  });

  const tokenIds = useMemo(() => {
    if (!tokenIdResults) return [];
    return tokenIdResults
      .filter((r) => r.status === "success")
      .map((r) => Number(r.result));
  }, [tokenIdResults]);

  return {
    hasNFT,
    balance: balanceNum,
    tokenIds,
    loading: balanceLoading || (hasNFT && tokenIdsLoading),
    error: balanceError as Error | null,
  };
}

// ============================================
// HypurrNFT Metadata Hook
// ============================================

export function useHypurrNFTs(tokenIds: number[]) {
  return useQueries({
    queries: tokenIds.map((tokenId) => ({
      queryKey: ["hypurr-metadata", tokenId],
      queryFn: () => fetchHypurrMetadata(tokenId),
      staleTime: Infinity, // NFT metadata doesn't change
      retry: 2,
    })),
  });
}

// ============================================
// Single NFT Metadata Hook
// ============================================

export function useHypurrNFTMetadata(tokenId: number | undefined) {
  const queries = useHypurrNFTs(tokenId !== undefined ? [tokenId] : []);
  return queries[0];
}
