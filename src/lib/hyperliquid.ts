import * as hl from "@nktkas/hyperliquid";
import type { WalletClient } from "viem";
import { BUILDER_ADDRESS, BUILDER_FEE_RATE, MAX_BUILDER_FEE_RATE } from "./constants";

// Singleton instances for read-only operations
let infoClientInstance: hl.InfoClient | null = null;
let subscriptionClientInstance: hl.SubscriptionClient | null = null;
let wsTransport: hl.WebSocketTransport | null = null;

export function getInfoClient(): hl.InfoClient {
  if (!infoClientInstance) {
    infoClientInstance = new hl.InfoClient({
      transport: new hl.HttpTransport(),
    });
  }
  return infoClientInstance;
}

export async function getSubscriptionClient(): Promise<hl.SubscriptionClient> {
  if (!subscriptionClientInstance) {
    wsTransport = new hl.WebSocketTransport();
    subscriptionClientInstance = new hl.SubscriptionClient({
      transport: wsTransport,
    });
  }
  return subscriptionClientInstance;
}

export function closeWebSocket(): void {
  if (wsTransport) {
    wsTransport.close();
    wsTransport = null;
    subscriptionClientInstance = null;
  }
}

// Create an exchange client for a connected wallet
export function createExchangeClient(walletClient: WalletClient) {
  return new hl.ExchangeClient({
    wallet: walletClient as any,
    transport: new hl.HttpTransport(),
  });
}

// Builder fee approval (one-time per user)
export async function approveBuilderFee(exchangeClient: hl.ExchangeClient): Promise<void> {
  await exchangeClient.approveBuilderFee({
    builder: BUILDER_ADDRESS,
    maxFeeRate: MAX_BUILDER_FEE_RATE,
  });
}

// Check if user has approved builder fee
export async function checkBuilderApproval(address: string): Promise<boolean> {
  const infoClient = getInfoClient();
  try {
    // For now, return false - the builder approval check can be implemented
    // when the user first tries to place an order
    // The SDK referral endpoint doesn't expose builderFeeApprovals directly
    const referral = await infoClient.referral({ user: address });
    // Check referrerState for builder approvals info
    const referrerState = (referral as any)?.referrerState;
    if (referrerState?.stage === "ready" && referrerState?.data?.builderFeeApprovals) {
      return referrerState.data.builderFeeApprovals.some(
        (approval: { builder: string }) =>
          approval.builder.toLowerCase() === BUILDER_ADDRESS.toLowerCase()
      );
    }
    return false;
  } catch (error) {
    console.error("Error checking builder approval:", error);
    return false;
  }
}

// Place an order with builder code
export interface PlaceOrderParams {
  exchangeClient: hl.ExchangeClient;
  assetIndex: number;
  isBuy: boolean;
  price: string;
  size: string;
  reduceOnly?: boolean;
  orderType: "limit" | "market";
  timeInForce?: "Gtc" | "Ioc" | "Alo";
}

export async function placeOrder(params: PlaceOrderParams) {
  const { exchangeClient, assetIndex, isBuy, price, size, reduceOnly = false, orderType, timeInForce = "Gtc" } = params;

  // For market orders, use FrontendMarket tif
  const orderSpec = orderType === "market"
    ? { limit: { tif: "FrontendMarket" as const } }
    : { limit: { tif: timeInForce } };

  const result = await exchangeClient.order({
    orders: [
      {
        a: assetIndex,
        b: isBuy,
        p: price,
        s: size,
        r: reduceOnly,
        t: orderSpec,
      },
    ],
    grouping: "na",
    builder: {
      b: BUILDER_ADDRESS,
      f: BUILDER_FEE_RATE,
    },
  });

  return result;
}

// Cancel an order
export async function cancelOrder(
  exchangeClient: hl.ExchangeClient,
  assetIndex: number,
  orderId: number
) {
  const result = await exchangeClient.cancel({
    cancels: [
      {
        a: assetIndex,
        o: orderId,
      },
    ],
  });
  return result;
}

// Cancel all orders for a coin
export async function cancelAllOrders(
  exchangeClient: hl.ExchangeClient,
  assetIndex: number
) {
  const result = await exchangeClient.cancelByCloid({
    cancels: [],
  });
  return result;
}

// Update leverage for an asset
export async function updateLeverage(
  exchangeClient: hl.ExchangeClient,
  assetIndex: number,
  leverage: number,
  isCross: boolean = true
) {
  const result = await exchangeClient.updateLeverage({
    asset: assetIndex,
    leverage,
    isCross,
  });
  return result;
}

// API Functions using InfoClient
export async function getOrderbook(coin: string) {
  const infoClient = getInfoClient();
  return await infoClient.l2Book({ coin });
}

export async function getAllMids() {
  const infoClient = getInfoClient();
  return await infoClient.allMids();
}

export async function getMeta() {
  const infoClient = getInfoClient();
  return await infoClient.meta();
}

export async function getMetaAndAssetCtxs() {
  const infoClient = getInfoClient();
  return await infoClient.metaAndAssetCtxs();
}

export async function getClearinghouseState(address: string) {
  const infoClient = getInfoClient();
  return await infoClient.clearinghouseState({ user: address });
}

export async function getOpenOrders(address: string) {
  const infoClient = getInfoClient();
  return await infoClient.openOrders({ user: address });
}

export async function getUserFills(address: string) {
  const infoClient = getInfoClient();
  return await infoClient.userFills({
    user: address,
  });
}

export async function getFundingHistory(address: string, startTime?: number) {
  const infoClient = getInfoClient();
  return await infoClient.userFunding({
    user: address,
    startTime: startTime || Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    endTime: Date.now(),
  });
}

// WebSocket Subscriptions
export async function subscribeToOrderbook(
  coin: string,
  callback: (data: { coin: string; levels: [Array<{ px: string; sz: string; n: number }>, Array<{ px: string; sz: string; n: number }>]; time: number }) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.l2Book({ coin }, callback as any);
}

export async function subscribeToTrades(
  coin: string,
  callback: (data: any) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.trades({ coin }, callback);
}

export async function subscribeToUserFills(
  address: string,
  callback: (data: { fills: any[] }) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.userFills({ user: address }, callback as any);
}

export async function subscribeToOrderUpdates(
  address: string,
  callback: (data: any) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.orderUpdates({ user: address }, callback);
}

export async function subscribeToAllMids(
  callback: (data: { mids: Record<string, string> }) => void
) {
  const subsClient = await getSubscriptionClient();
  return await subsClient.allMids(callback as any);
}
