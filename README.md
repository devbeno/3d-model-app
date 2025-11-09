# 3D Model Management Application

Interaktivna web aplikacija za upravljanje 3D modelima sa podrškom za 2D/3D prikaze, drag & drop funkcionalnost, rotaciju i real-time sinhronizaciju sa Firestore bazom podataka.

## O Projektu

Ova aplikacija je razvijena kao zadatak koji demonstrira:
- Integraciju 3D grafike u web aplikaciju
- Real-time perzistenciju podataka
- Modernu React/Next.js arhitekturu
- TypeScript type safety
- Intuitivno korisničko iskustvo

## Funkcionalnosti

- **3D Prikaz** - Interaktivna 3D scena sa OrbitControls kamerom
- **2D Top-Down View** - Alternativni pogled odozgo
- **Drag & Drop** - Prevlačenje modela mišem u realnom vremenu
- **Collision Detection** - Sprečavanje preklapanja modela
- **Rotation Controls** - Precizna rotacija po X, Y, Z osama sa slajderima
- **Firestore Sync** - Automatsko čuvanje i učitavanje pozicija/rotacija
- **GLB Model Support** - Podrška za standardni 3D format
- **Responsive UI** - Adaptirano korisničko sučelje

## Tech Stack

### Frontend
- **Next.js 16** - React framework sa App Router
- **TypeScript** - Statičko tipiziranje
- **React 19** - UI biblioteka
- **Tailwind CSS** - Utility-first styling

### 3D Graphics
- **Three.js** - 3D rendering engine
- **React Three Fiber** - React renderer za Three.js
- **React Three Drei** - Pomoćne komponente (OrbitControls, Grid, useGLTF)

### Backend & Database
- **Firebase 11** - Backend-as-a-Service
- **Firestore** - NoSQL database za perzistenciju

### Development
- **ESLint** - Code linting
- **Turbopack** - Fast bundler

## Instalacija i Pokretanje

### Preduslovi
- Node.js 18+ i npm

### 1. Kloniranje projekta
```bash
git clone <your-repo-url>
cd 3d-model-app
```

### 2. Instalacija dependencies
```bash
npm install
```

### 3. Firebase Setup

#### a) Kreiranje Firebase projekta
1. Idite na [Firebase Console](https://console.firebase.google.com/)
2. Kliknite **"Add project"**
3. Unesite ime projekta
4. Kliknite **"Create project"**

#### b) Dodavanje Web App
1. U Firebase Console, kliknite na **"</>"** (Web) ikonu
2. Registrujte aplikaciju
3. Kopirajte Firebase config objekat

#### c) Omogućavanje Firestore
1. Idite na **Build → Firestore Database**
2. Kliknite **"Create database"**
3. Izaberite lokaciju (npr. europe-west za Evropu)
4. Izaberite **"Start in test mode"**
5. Kliknite **"Enable"**

#### d) Firestore Security Rules
Za development, postavite sledeća pravila:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

** VAŽNO**: Za produkciju, ograničite pristup!

#### e) Environment Variables
Kreirajte `.env.local` fajl:

```bash
cp .env.local.example .env.local
```

Popunite sa vašim Firebase kredencijalima:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Dodavanje 3D Modela

**Preuzimanje GLB modela:**
- [Poly Pizza](https://poly.pizza/) - Preporučeno (mali, optimizovani modeli)
- [Sketchfab](https://sketchfab.com/) - Filter: "Downloadable" + "glTF"
- [Quaternius](https://quaternius.com/) - Game-ready modeli
- [Kenney](https://kenney.nl/assets) - Besplatni game assets

**Dodavanje u projekat:**
1. Preuzmite dva GLB modela (preporučeno < 2MB po modelu)
2. Preimenujte ih u `model1.glb` i `model2.glb`
3. Stavite ih u `public/models/` folder

```
public/
  └── models/
      ├── model1.glb
      └── model2.glb
```

### 5. Pokretanje Development Servera

```bash
npm run dev
```

Otvorite [http://localhost:3000](http://localhost:3000) u browseru.

## Kako Koristiti

### Toggle 2D/3D View
- **Lokacija**: Gore desno
- **Funkcija**: Prebacivanje između 3D perspektive i 2D top-down pogleda
- **3D Mode**: Omogućava rotaciju kamere
- **2D Mode**: Fiksna kamera odozgo

### Drag & Drop Modeli
1. Kliknite na model
2. Držite i prevucite mišem
3. Pustite na željenoj poziciji
4. Pozicija se automatski čuva u Firestore

**Napomena**: Detekcija kolizija sprečava preklapanje modela.

### Rotacija Modela
- **Lokacija**: Dole levo
- **Kontrole**:
  - **X**: Rotacija oko horizontalne ose
  - **Y**: Rotacija oko vertikalne ose
  - **Z**: Rotacija oko dubinske ose
- Pomerite slajder za željeni ugao (0-360°)
- Rotacija se automatski čuva u Firestore

### Kamera Kontrole (3D Mode)
- **Rotacija**: Levi klik + drag
- **Zoom**: Scroll ili pinch
- **Pan**: Desni klik + drag (ili srednji klik)

## Arhitektura Projekta

```
3d-model-app/
├── app/
│   ├── page.tsx              # Glavna stranica sa state managementom
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Globalni stilovi
│
├── components/
│   ├── DraggableModel.tsx    # 3D model sa drag funkcionalošću
│   ├── Scene.tsx             # 3D Canvas scena
│   ├── RotationControl.tsx   # UI kontrole za rotaciju
│   └── ViewToggle.tsx        # Toggle dugme za 2D/3D
│
├── lib/
│   ├── firebase.ts           # Firebase app inicijalizacija
│   └── firestore.ts          # CRUD operacije za modele
│
├── types/
│   └── model.ts              # TypeScript type definitions
│
├── public/
│   └── models/               # GLB 3D modeli (dodajte ovde)
│
├── .env.local.example        # Template za environment varijable
├── .env.local                # Vaši Firebase credentials (ne commituje se)
├── package.json              # Dependencies
└── README.md                 # Ova dokumentacija
```

### Komponente

#### `app/page.tsx`
- Root komponenta aplikacije
- State management za modele, pozicije i rotacije
- Integracija Firebase učitavanja/spremanja
- Wrapper za Scene, ViewToggle i RotationControl

#### `components/Scene.tsx`
- Three.js Canvas setup
- Lighting (ambient, directional, hemisphere)
- Grid helper za referentnu ravan
- OrbitControls za kamera manipulaciju
- Suspense za GLB loading

#### `components/DraggableModel.tsx`
- GLB model loading sa useGLTF hook-om
- Pointer events za drag & drop
- Collision detection između modela
- Automatsko spremanje u Firestore

#### `components/RotationControl.tsx`
- UI slajderi za X, Y, Z rotaciju
- Real-time update rotacije
- Automatsko spremanje u Firestore

#### `components/ViewToggle.tsx`
- Toggle dugme sa SVG ikonama
- Prebacivanje između 2D/3D camera pogleda

## Firestore Data Structure

```typescript
// Collection: models
{
  "model1": {
    position: { x: -2, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelPath: "/models/model1.glb"
  },
  "model2": {
    position: { x: 2, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelPath: "/models/model2.glb"
  }
}
```

### Firestore Operacije

**Učitavanje modela:**
```typescript
const model = await loadModelData('model1');
```

**Spremanje modela:**
```typescript
await saveModelData({
  id: 'model1',
  position: { x: 1, y: 0, z: 1 },
  rotation: { x: 0, y: 1.57, z: 0 },
  modelPath: '/models/model1.glb'
});
```

## Build za Produkciju

```bash
# Build
npm run build

# Start production server
npm start
```

## Troubleshooting

### Modeli se ne prikazuju
- Proverite da postoje `model1.glb` i `model2.glb` u `public/models/`
- Proverite da su modeli < 5MB (preporučeno < 2MB)
- Refresh stranicu (Ctrl+R)

### Firebase/Firestore greške
- Proverite da je `.env.local` pravilno konfigurisan
- Proverite da je Firestore omogućen u Firebase Console
- Proverite Firestore Security Rules (test mode za development)

### WebGL Context Lost
- Modeli su preveliki (optimizujte ili koristite manje modele)
- Previše poligona (koristite low-poly modele)
- Refresh browser

### React DevTools warning
-Warning "Invalid argument not valid semver" je benign - dolazi od DevTools ekstenzije
-Možete ignorisati ili ažurirati React DevTools ekstenziju

## Napomene

- Aplikacija **ne zahteva autentikaciju** - dostupna je svima
- Svi korisnici mogu **uređivati pozicije i rotacije**
- **Nema aktivnog database listenera** (prema zahtevima zadatka)
- Promene se čuvaju **on-demand** (pri drag-u ili rotaciji)
- `.env.local` **ne commituje** se na GitHub (gitignore)