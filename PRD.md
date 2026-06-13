# Product Requirements Document (PRD) - SmartyEvents

## 1. Executive Summary

SmartyEvents is a multi-tenant, blockchain-powered event management and ticketing Software-as-a-Service (SaaS). The platform enables event organizers (tenants) to host events, customize agendas with speakers/tracks, and issue fraud-proof tickets as custom digital assets on the Stellar blockchain. Attendees enjoy true decentralized ownership of their tickets, while organizers benefit from transparent ticketing metrics and a highly secure, offline-capable QR check-in gate verification system.

---

## 2. Product Objectives

* **Eliminate Ticket Fraud & Scalping**: Tickets are represented as distinct assets on the Stellar blockchain, ensuring single-ownership status and making duplicate or forged tickets impossible.
* **Streamline Multi-Tenant SaaS Operations**: Isolate data, branding, and billing for individual organizations while providing central portals for discoverability and authentication.
* **Ensure Fast, Resilient Check-In**: Create a check-in protocol utilizing time-sensitive cryptographic HMAC tokens that can verify ticket validity at event gates even under poor network conditions.
* **Demonstrate Blockchain Utility**: Hide blockchain complexity from non-technical users via custodial wallet setups, while maintaining full decentralization of ticket assets.
* **Preserve Attendee Privacy (Zero-Knowledge)**: Provide a zero-knowledge check-in option enabling attendees to verify ticket ownership without revealing identity or Stellar address details, using on-chain smart contracts.

---

## 3. User Personas

| Persona | Description | Needs & Goals |
| :--- | :--- | :--- |
| **Event Organizer (Tenant)** | Professional host or company organizing conferences, concerts, or meetups. | Quick setup, tenant-scoped branding, flexible ticketing tiers, speaker/agenda planning tools, and real-time gate attendance stats. |
| **Attendee (Buyer)** | Customers buying tickets for events. | Frictionless checkout using traditional currency or Stellar USDC, secure storage of tickets, and easy entry presentation at the gate. |
| **Gate Staff (Scanners)** | Staff verifying tickets at the event entrance. | Extremely fast verification process, clear valid/invalid indicators, and resilience against offline network drops. |

---

## 4. Functional Requirements (MVP)

### A. Tenant Configuration & Management
* **Organization Onboarding**: Organizers can sign up and create a Tenant space with a unique name, slug (subdomain), and branding details.
* **Stellar Account Setup**: The system automatically configures separate issuing and distribution Stellar wallets for the tenant to isolate transaction fees and asset supplies.

### B. Event & Agenda Management
* **Event Creation**: Tenants can create events with metadata (title, banner, description, dates, capacity, location).
* **Agendas & Tracks**: Event dashboards allow planning multi-track itineraries, defining event rooms, and scheduling sessions.
* **Speaker Directory**: Tenants can build speaker lists with photos, bios, and social media handles, linking them to relevant sessions.
* **Tiered Ticketing**: Organizers can customize ticket classes (e.g., Early Bird, General Admission, VIP) with custom pricing, maximum capacity bounds, and descriptions of benefits.

### C. Booking & Stellar Minting
* **Checkout Flow**: Attendees purchase tickets. Checkout accepts simulated credit card payments or Stellar USDC.
* **Dynamic Wallet Creation**: If the attendee does not have a Stellar public key, a custodial Stellar keypair is generated and automatically funded with gas (XLM) via Friendbot.
* **Trustline and Minting**: 
  * The attendee's key signs a trustline (ChangeTrust) to authorize the custom ticket asset.
  * The tenant's distributor wallet sends exactly `1` ticket asset (e.g., `EVT26VIP`) to the attendee's public key.
  * The transaction hash is stored in the database.
* **ZK Privacy Opt-In**: Attendees can opt-in to "ZK Privacy" mode. If chosen, the browser generates a local secret and nullifier, and submits a public commitment hash (`commitment = Hash(secret, nullifier)`) to the backend to store with the ticket.

### D. Attendee Digital Wallet
* **Ticket View**: A dashboard displaying all tickets matching the attendee's email/account.
* **Dynamic QR Code**: Displays a QR code representing a cryptographic token. To prevent screenshots from being re-used or shared, the token contains a timestamp and is signed with HMAC-SHA256, regenerating every 30 seconds.
* **Zero-Knowledge Proof QR**: For ZK-enabled tickets, the wallet generates a ZK proof client-side, showing a "🛡️ ZK Privacy" badge, and packages the proof payload (`proof`, `nullifierHash`, and `commitment`) into the QR code for entry.

### E. Gate Check-In Verification
* **Cryptographic Verification**: The check-in tool decodes the scanned QR token, checks the HMAC signature for tampering, and verifies that the ticket is not expired.
* **On-Chain Balance Check**: Queries the Stellar Horizon network to verify that the attendee's public key holds a balance `>= 1` of the ticket asset code issued by the tenant.
* **Double-Spend Check**: Confirms that the `ticketId` has not already been marked checked-in in the database.
* **On-Chain Soroban ZK Verification**: When scanning a ZK-proof QR code, the gate verification calls a Soroban contract method `verify_and_claim` on-chain (Stellar Testnet) to validate the ZK proof and verify the `nullifierHash` is unspent.
* **On-Chain Double-Spend Protection**: The Soroban contract stores spent `nullifierHash` values in its persistent ledger storage, preventing double-spend attempts trustlessly on the blockchain.

---

## 5. Non-Functional Requirements

### A. Performance & Scalability
* **Horizon Query Optimizations**: Account balance queries should cache connection instances to minimize round-trip delays to Stellar Horizon servers.
* **Gate Latency**: Ticket verification should process within `< 2 seconds` under standard network connection.

### B. Security & Integrity
* **Data Isolation**: Strict query filters must ensure that no tenant can view or modify events, attendees, or configurations of another tenant.
* **Secret Protection**: All Stellar private keys (distributor and issuer secrets) must be encrypted before storage or loaded securely via system environment variables.

---

## 6. Future Scope (Post-MVP)

1. **Decentralized Ticket Resale Marketplace**: A built-in secondary marketplace utilizing the Stellar Decentralized Exchange (DEX) to allow P2P sales within price caps set by the organizer.
2. **Push Notifications**: Automated SMS/Email/Whatsapp alerts containing ticket delivery links and event schedule adjustments.
3. **Advanced Analytics**: Multi-event financial charts, sales projection reports, and post-event attendee engagement reports.
