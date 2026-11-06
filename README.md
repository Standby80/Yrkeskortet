# Yrkeskortet (yrkeskortet.se) 🦺

Sveriges förmånsportal för alla med **ID06** – en motsvarighet till Mecenat/Studentkortet fast för hantverkare, tekniker och yrkesfolk inom bygg och entreprenad.

## 🚀 Funktioner

- **Exklusiva rabatter & erbjudanden**: Sök och filtrera efter kategorier (*Lunch & Mat*, *Verktyg & Kläder*, *Fordon & Drivmedel*, *Mobil & Vardag*).
- **ID06-skyddat förmånslås**: Rabattkoder och butikslänkar låses automatiskt upp för medlemmar med verifierat ID06.
- **Lokala deals nära bygget**: Hitta dagens lunch, biltvätt och lokala butiker runt din aktuella arbetsplats baserat på avstånd.
- **Digitalt Apple Wallet-pass**: Exklusivt medlemskort med 3D-känsla, realtidsklocka med sekundvisare för äkthetsverifiering, samt vändbart kort med QR-kod och Code-128 streckkod för kassascanning.
- **AI-verifiering av ID06 (Google Gemini Vision)**: Skanna eller fota ditt ID06-kort för omedelbar automatisk identifiering och verifiering.
- **Inbyggd Admin-portal**: Lösenordsskyddad hantering för att skapa nya erbjudanden och godkänna/avslå ID06-ansökningar.

## 🛠 Teknisk Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Backend & Databas**: Supabase (PostgreSQL, Auth, Realtime)
- **AI Vision**: Google Gemini 2.5 / 3.5 Flash API

## 💻 Kom igång lokalt

1. Klona repositoryt:
   ```bash
   git clone https://github.com/Standby80/Yrkeskortet.git
   cd Yrkeskortet
   ```

2. Installera beroenden:
   ```bash
   npm install
   ```

3. Starta utvecklingsservern:
   ```bash
   npm run dev
   ```

4. Bygg för produktion:
   ```bash
   npm run build
   ```
