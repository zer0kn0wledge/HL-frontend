# HL Trader - Hyperliquid Trading Frontend

A modern, responsive trading frontend for Hyperliquid perpetual futures with builder code integration.

## Features

- **Real-time Market Data**: Live orderbook and price updates via WebSocket
- **Wallet Integration**: Seamless connection via Reown AppKit (WalletConnect)
- **Builder Code Support**: Integrated builder fee system for revenue generation
- **Position Management**: View, manage, and close positions
- **Order Management**: Place limit/market orders with leverage control
- **Trade History**: Complete transaction history and PnL tracking
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Hyperliquid SDK**: @nktkas/hyperliquid
- **Wallet**: Reown AppKit + Wagmi
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Styling**: TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Reown Project ID (get one at [cloud.reown.com](https://cloud.reown.com))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd HL-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your Reown Project ID:
```
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Builder Configuration

To earn fees as a builder on Hyperliquid:

1. **Register as a Builder**: Ensure your builder wallet has ≥100 USDC in perps account value
2. **Update Builder Address**: Edit `src/lib/constants.ts` and set your `BUILDER_ADDRESS`
3. **Set Fee Rate**: Adjust `BUILDER_FEE_RATE` (in 1/10000th of bps)

```typescript
// src/lib/constants.ts
export const BUILDER_ADDRESS = "0xYOUR_BUILDER_ADDRESS" as const;
export const BUILDER_FEE_RATE = 50; // 0.005%
export const MAX_BUILDER_FEE_RATE = "0.05%";
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main trading page
├── components/
│   ├── providers.tsx      # React Query & Wagmi providers
│   ├── trading/           # Trading components
│   │   ├── account-info.tsx
│   │   ├── builder-approval-modal.tsx
│   │   ├── data-provider.tsx
│   │   ├── header.tsx
│   │   ├── market-selector.tsx
│   │   ├── open-orders.tsx
│   │   ├── order-form.tsx
│   │   ├── orderbook.tsx
│   │   ├── positions.tsx
│   │   ├── trade-history.tsx
│   │   └── trading-panel.tsx
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── tabs.tsx
│   └── wallet/
│       └── connect-button.tsx
├── hooks/
│   └── use-hyperliquid.ts # Custom hooks for HL integration
├── lib/
│   ├── constants.ts       # App constants & builder config
│   ├── hyperliquid.ts     # Hyperliquid client utilities
│   ├── utils.ts           # Utility functions
│   └── wagmi-config.ts    # Wagmi/AppKit configuration
├── store/
│   └── trading-store.ts   # Zustand state management
└── types/
    └── index.ts           # TypeScript type definitions
```

## Key API Methods

### InfoClient (Read Operations)
- `l2Book()` - Get orderbook data
- `allMids()` - Get all mid prices
- `clearinghouseState()` - Get user positions & margin
- `openOrders()` - Get user's open orders
- `userFills()` - Get trade history

### ExchangeClient (Write Operations)
- `approveBuilderFee()` - One-time builder fee approval
- `order()` - Place orders with builder code
- `cancel()` - Cancel orders
- `updateLeverage()` - Update leverage settings

### SubscriptionClient (Real-time)
- `l2Book()` - Live orderbook updates
- `allMids()` - Live price updates
- `userFills()` - Live fill notifications
- `orderUpdates()` - Order status updates

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Deployment

The app is optimized for deployment on:
- **Vercel** (recommended)
- **Netlify**
- **Any Node.js hosting**

For Vercel deployment:
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

## Future Improvements

- [ ] TradingView chart integration
- [ ] Advanced order types (TWAP, scaled orders)
- [ ] Copy trading functionality
- [ ] Portfolio analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Dark/light theme toggle

## Resources

- [Hyperliquid API Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api)
- [Builder Codes Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/builder-codes)
- [@nktkas/hyperliquid SDK](https://github.com/nktkas/hyperliquid)
- [Reown AppKit Docs](https://docs.reown.com/appkit/overview)

## License

MIT
