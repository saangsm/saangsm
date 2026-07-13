# SaanGSM - Soko la Huduma za GSM Tanzania 🇹🇿

SaanGSM ni mfumo thabiti na kamili wa website ya marketplace ya huduma za GSM (simu za mkononi) kwa ajili ya mafundi wa simu Tanzania. Huu ni mfumo ulioundwa kwa kutumia **React + TypeScript + Vite** upande wa Frontend, na **Node.js (Express) + SQLite (better-sqlite3)** upande wa Backend.

Mfumo unashughulikia huduma tatu kuu za GSM:
1. **IMEI & FRP Bypass** - Uwasilishaji wa namba za IMEI/Serial kwa ajili ya kufungua mitandao, FRP bypass, iCloud removal, MDM bypass, n.k.
2. **Server & Activations** - Kupokea maombi ya activation za zana za GSM (UnlockTool, DFT Pro, EFT Pro, Pandora, Z3X, AMT) kwa akaunti zilizopo.
3. **Tool Rentals (Kukodisha)** - Ukodishaji wa haraka na wa kiotomatiki (simulated automatic API tokens) wa zana hizo kwa saa chache (masaa 3 au masaa 6) kwa mafundi wadogo.

---

## 📂 Muundo wa Folder (Project Directory Structure)

Mfumo umeundwa kwa njia safi na ya ki-moduli ili kuongeza ufanisi:

```text
/
├── server.ts                 # Backend Server (Express, SQLite DB init & Seeding, REST APIs, Webhook)
├── package.json              # Maelezo ya Dependencies na Scripts (build, dev, start)
├── metadata.json             # Maelezo ya jina la mfumo na permissions
├── tsconfig.json             # Usanidi wa TypeScript Compiler
├── vite.config.ts            # Usanidi wa Vite Bundler
├── .env.example              # Mfano wa vigezo vya mazingira (Environment Variables)
│
├── src/
│   ├── main.tsx              # Entry point kuu ya React application
│   ├── index.css             # Mitindo ya Tailwind CSS, Fonti (Inter, Space Grotesk, JetBrains Mono)
│   ├── App.tsx               # State Router (Navigation engine, user session controller)
│   ├── types.ts              # Data models na types za TypeScript (User, Order, Service, Rental, n.k.)
│   │
│   └── components/           # Sub-components za kurasa
│       ├── Navbar.tsx        # Navigational bar ya juu yenye session controls
│       ├── HomeView.tsx      # Ukurasa wa nyumbani (Hero, Categories, Featured Chips)
│       ├── ServicesView.tsx  # Ukurasa wa katalogi ya huduma zenye tabs na search
│       ├── ServiceDetailView.tsx # Ukurasa wa kuagiza huduma yenye dynamic form (IMEI/SN fields)
│       ├── CheckoutView.tsx  # Ukurasa wa malipo ya mitandao ya simu na status polling
│       ├── AuthView.tsx      # Fomu za Kuingia (Login) na Kujisajili (Register + Admin key)
│       ├── AccountView.tsx   # Ukurasa wa mteja kuona oda zake na logins za kukodisha tool
│       └── AdminDashboardView.tsx # Panel ya utawala (KPI, CRUD, Customer Toggle, Credentials Injector)
```

---

## 🛠️ Jinsi ya Kuanza (Quickstart & Local Development)

Ili uweze kuendesha na kufanya majaribio ya SaanGSM kwenye kompyuta yako:

1. **Sakinisha Dependencies zote:**
   ```bash
   npm install
   ```

2. **Kuanzisha Server ya Mazoezi (Development mode):**
   ```bash
   npm run dev
   ```
   *Hii itaanzisha server kwenye port ya `http://localhost:3000` ikijumuisha Vite middleware.*

3. **Database Seeding ya Kwanza:**
   Unapoanzisha server kwa mara ya kwanza, database ya SQLite `saangsm.db` itajiumba yenyewe na kuweka kategoria zote 3 na huduma 6 za mfano za GSM (kama vile UnlockTool activation, Samsung FRP bypass, na Rentals za masaa 3) ili uanze majaribio mara moja.

---

## 👑 Bootstrapping Admin (Akaunti ya Utawala)

Ili kujisajili kama Admin wa kwanza kwenye mfumo wa SaanGSM:
1. Nenda kwenye ukurasa wa **Sajili (Register)** kwenye tovuti.
2. Jaza jina lako, email, na namba ya simu.
3. Bofya kitufe cha **"Usajili wa Admin (Special Setup Key)"** kilichopo chini ya password.
4. Jaza siri ya admin: `SaanGSMAdmin2026!`
5. Bonyeza **"Sajili Akaunti Mpya"**. Mfumo utakutambua kama **Admin** mara moja na kukupeleka kwenye **Admin Panel**!

Ukiwa kama Admin, una uwezo kamili wa kufanya:
- Kuona takwimu za mapato na kiasi cha oda.
- Kusasisha hali ya oda za wateja (`processing` au `completed`).
- Kuandika mrejesho (Notes) au kumpa logins za tool za kukodisha ( Credentials Injector).
- Kuongeza, kuhariri, au kufuta Huduma (Services) na Kategoria.
- Kusimamisha (Block) au Kuruhusu (Unblock) wateja.

---

## 🚀 Jinsi ya Kupeleka Live (Production Deployment)

SaanGSM inategemea faili moja la SQLite database `saangsm.db` ambalo linafaa sana kupakiwa kwenye Docker, Cloud Run, VPS yoyote (DigitalOcean, AWS, Linode) au hosting za Node.js:

1. **Kujenga Toleo la Uzalishaji (Production Build):**
   ```bash
   npm run build
   ```
   *Amri hii itajenga static files za React kwenye folder la `dist/` na kisha kutumia esbuild kuunganisha faili zote za backend TypeScript kuwa faili moja la JavaScript `dist/server.cjs`.*

2. **Kuendesha toleo lililojengwa (Production Start):**
   ```bash
   NODE_ENV=production npm run start
   ```
   *Hii itaendesha mfumo kwa kasi kubwa ikitumia Port `3000` na Host `0.0.0.0`.*

---

## 💳 Tanzania Mobile Money API Integration (M-Pesa, Tigo Pesa, Airtel Money, HaloPesa)

Katika biashara ndogo za GSM Tanzania, njia rahisi na salama ya kupokea malipo ni kutumia **Payment Aggregator** kama vile **AzamPay**, **Selcom**, au **ClickPesa**. Kampuni hizi hutoa API moja inayounganisha mitandao yote mikubwa.

Chini ni mwongozo wa kiufundi wa namna ya kuunganisha API halisi:

### 1. Muundo wa Ombi la Malipo (Mobile money USSD Push Request)

Wakati mteja anapobonyeza kulipia, utatuma POST Request kutoka server yako kwenda kwenye endpoint ya aggregator (mfano: AzamPay):

```typescript
// Mfano wa API request unayoiweka kwenye server.ts kuchukua nafasi ya simulation
import axios from "axios";

async function initiateRealMobileMoneyPayment(
  provider: string, // 'Vodacom', 'Tigo', 'Airtel', 'Halotel'
  phone: string,     // e.g. "255757224250"
  amount: number,    // e.g. 15000
  reference: string  // e.g. "SAAN-2026-X1Y2Z"
) {
  // Kubadili namba kuanza na 255
  const formattedPhone = phone.startsWith("0") ? "255" + phone.substring(1) : phone;

  const paymentPayload = {
    accountNumber: formattedPhone,
    amount: amount,
    currency: "TZS",
    externalId: reference,
    provider: provider, // Aggregator specifications
    additionalProperties: {
      merchantMemo: `Malipo ya SaanGSM - Oda: ${reference}`
    }
  };

  try {
    const response = await axios.post("https://api.azampay.co.tz/v1/checkout/trigger", paymentPayload, {
      headers: {
        "Authorization": `Bearer ${process.env.AZAMPAY_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    
    // Aggregator atarudisha TransactionId
    return response.data; // { success: true, transactionId: "AZM-99120" }
  } catch (error) {
    throw new Error("Mawasiliano na AzamPay yamefeli.");
  }
}
```

### 2. Kupokea Webhook Callbacks (Uthibitisho wa Malipo kutoka kwa Aggregator)

Mteja anapoweka namba yake ya siri kwenye simu yake, kampuni ya simu itamturumia fedha na kisha mtandao utatuma taarifa kwa Aggregator. Aggregator atatuma POST Request kwenye endpoint yako ya **Webhook** uliyoisajili (kama `/api/payments/callback` kwenye server.ts):

```typescript
// Mfano wa kusindika Callback halisi
app.post("/api/payments/callback", (req, res) => {
  const { transactionId, externalId, status, errorCode, message } = req.body;

  // 1. Thibitisha saini ya kiusalama (Signature checking, mfano: JWT au HMAC SHA256)
  // Hii inazuia wadukuzi kutuma callbacks za uongo
  const incomingSignature = req.headers["x-signature"];
  if (!verifySignature(req.body, incomingSignature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  try {
    // 2. Tafuta muamala kwenye database ya SQLite
    const payment = db.prepare("SELECT * FROM payments WHERE external_transaction_id = ?").get(transactionId) as any;
    
    if (payment && payment.status === "initiated") {
      if (status === "SUCCESS") {
        // Lipia oda
        db.prepare("UPDATE payments SET status = 'success' WHERE id = ?").run(payment.id);
        db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(payment.order_id);
        
        // Kama huduma ni ya kukodisha (Rental), amilisha login credentials mara moja!
        provisionRentalIfNeeded(payment.order_id);
      } else {
        // Imefeli
        db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(payment.id);
        db.prepare("UPDATE orders SET status = 'failed', admin_notes = ? WHERE id = ?").run(
          message || "Malipo yameshindikana au mteja ameghairi.",
          payment.order_id
        );
      }
    }
    
    res.status(200).json({ status: "ACK" }); // Thitibitisha kuwa callback imesindikwa
  } catch (err) {
    res.status(500).json({ error: "Server processing failed" });
  }
});
```

---

## 🔒 Ulinzi na Usalama wa Mfumo (Security Hardening)

1. **JWT Auth:** Token ya siri kwa mteja inafichwa na kuzuia wateja wasio na sifa kuona data za wateja wengine au paneli ya utawala.
2. **Rate Limiting:** Fomu ya login na register zinalindwa na Express custom rate limiters ili kuzuia mashambulio ya *brute force* ya kijambazi au spamming ya API.
3. **Database Input Sanitization:** SQLite queries zote zinatumia *prepared statements* kuzuia mashambulio ya *SQL Injection* kamilifu.
