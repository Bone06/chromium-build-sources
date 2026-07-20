# Chromium build source integration contract

Ez a Chromium Build Sources aggregátor és a Chromium Update Notifications
extension közös, kanonikus koordinációs dokumentuma. Mindkét projektben végzett
munka előtt el kell olvasni.

## Projektek és felelősségek

### `chromium-build-sources`

- Ismeri a külső buildforrásokat és azok eltérő release/tag/asset formátumát.
- Forrásonként lekéri, validálja és normalizálja az adatokat.
- Izolálja a forráshibákat és megőrzi az utolsó sikeres adatokat.
- Verziózott, statikus JSON feedet publikál HTTP-n keresztül.
- Nem tartalmaz extension UI- vagy Chrome API-logikát.

### `chromium-notifier`

- Nem kérdezi le közvetlenül az egyes GitHub repositorykat.
- Egyetlen normalizált feedet kér le a háttérfolyamatban.
- Szigorúan validálja a feed sémáját és biztonságos URL-jeit.
- Cache-eli az utolsó sikeres adatot, kezeli a stale/hibaállapotot, és a
  storage-ból jeleníti meg az adatokat a popupban.
- Nem ismeri az upstream repositoryk egyedi tag- vagy assetformátumát.

## Adatfolyam

```text
upstream build repositoryk
          ↓
forrásadapterek és validálás
          ↓
verziózott statikus JSON feed
          ↓
notifier service worker → chrome.storage.local → popup
```

## Kísérleti feed v1 szerződés

A `schemaVersion: 1` kísérleti feed gyökérmezői:

```text
schemaVersion: 1
generatedAt: UTC ISO 8601
sources: source rekordok tömbje
builds: build rekordok tömbje
```

A source rekord legalább az alábbi jelentést fedi le:

```text
id, name, repository, checkedAt, lastSuccessAt, stale, error
```

A build rekord legalább az alábbi jelentést fedi le:

- buildazonosító
- platform és architektúra
- build tag/csatorna
- Chromium-verzió
- revision, ha a forrás biztosítja
- kiadási idő
- forrásnév, repository és release provenance
- letöltési assetek címkével, HTTPS URL-lel, mérettel és opcionális checksum-mal
- forrásonkénti utolsó próbálkozás, utolsó siker, stale állapot és hiba
- opcionális buildjellemzők, például Sync, proprietary codecs és Widevine

Minden időpont szabványos UTC ISO 8601 szöveg legyen. A verziókat szemantikailag
nem szabad egyszerű szövegrendezéssel összehasonlítani.

## Első igazolt forrás

`Hibbiki/chromium-win64`

- Platform: Windows x64.
- Build: stable, official, proprietary codecs, Widevine, Google Sync.
- API: `https://api.github.com/repos/Hibbiki/chromium-win64/releases/latest`.
- Tagminta: `v<chromium-version>-r<revision>`.
- Automatikusan publikálható assetek: Archive (`chrome.7z`) és Installer
  (`mini_installer.exe`).
- A Policy templates (`policy_templates.zip`) nem szükséges az extensionhöz,
  ezért figyelmen kívül hagyandó.
- Más assetkategóriát vagy egyedi nevű assetet az adapter alapértelmezés szerint
  figyelmen kívül hagy. Publikálása előtt felhasználói megerősítés szükséges.
- Ez önmagában nem helyettesíti a Woolyss teljes platformlistáját.

## Jóváhagyott többforrásos migráció

A felhasználói forráslista a `SOURCE_CANDIDATES.md`, az ellenőrzött technikai
release-, tag- és assetmátrix a `SOURCE_MATRIX.md` fájlban található. A Hibbiki
mellett a macchrome Windows, macOS és Linux repositoryi, valamint a RobRich
Windows AVX/AVX2/AVX512 és Linux DEB/RPM AVX/AVX2 változatai migrálandók.

## Nem alku tárgya

- Az upstream válaszok nem megbízható adatok.
- Repository-, tag-, asset- és URL-engedélylista szükséges.
- Csak HTTPS letöltési link publikálható.
- Egy hibás forrás nem törölheti más forrás vagy saját korábbi sikeres adatát.
- A feed méretét és a hálózati kérések idejét korlátozni kell.
- Az extensionnek a szerveroldali validálás mellett saját validálást is kell
  végeznie.
- Séma inkompatibilis módosítása új `schemaVersion` értéket igényel.

## Koordinációs szabály

Ha a feed szerkezete vagy bármely mező jelentése változik:

1. először ez a dokumentum frissítendő;
2. az aggregátor tesztfixture-je és szerződéstesztje frissítendő;
3. a notifier megfelelő fixture-je és validációs tesztje frissítendő;
4. csak ezután módosítható a produkciós feed vagy endpoint.

Az egyes repositoryk saját `AI_CONTEXT.md` fájljai a projektspecifikus döntések
helyei; a két projekt közös szerződésének mindig ez a fájl az elsődleges
forrása.

## Helyi integrációs környezet

A felhasználó engedélyezte, hogy a közös fejlesztőgép ideiglenes webszerverként
kiszolgálja az aggregátor helyi feedjét a notifier teszteléséhez.

- Alapértelmezett kötés: `127.0.0.1`, véletlenszerű vagy előre egyeztetett port.
- A szerver csak a szükséges teszt idejére fusson, majd szabályosan álljon le.
- Ne módosítsa a normál Chromium-profilt, a rendszerindítást vagy a tűzfalat.
- LAN- vagy internetes publikálás, porttovábbítás és tartós szolgáltatás külön
  felhasználói engedélyt igényel.
- A produkciós endpointot és hostingot ez az engedély nem dönti el.

## Új forrás bevezetési és élesítési ellenőrzőlista

1. Rögzíteni kell a repositoryt, platformot, architektúrát, buildjellemzőket,
   release API-t, tagmintát és a kiadási idő forrását.
2. Az Archive és Installer kategória automatikusan elfogadható. A Policy
   templates kimarad; minden más vagy egyedi assetről publikálás előtt meg kell
   kérdezni a felhasználót.
3. Külön adapterben engedélylistázni és validálni kell a repository-, release-,
   tag-, asset- és HTTPS URL-formátumot. Ismeretlen extra assetet figyelmen kívül
   kell hagyni.
4. Fixture-rel tesztelni kell a sikeres normalizálást, a hiányzó kötelező
   assetet, a megváltozott tagot, a tiltott URL-t és az extra assetek szűrését.
5. A teljes aggregátorteszt után valódi upstream válaszból kell feedet
   generálni, majd ellenőrizni a verziót, revisiont, provenance-t és a publikált
   letöltéseket.
6. Az új feedet először kizárólag loopback szerverről kell az extension
   kísérleti ágával kipróbálni. Ellenőrizendő a popup, a linkek, a platform/tag
   választás, a verzió-összehasonlítás és a badge.
7. Egy sikeres lekérés után a szervert le kell állítani, majd `Check now`
   művelettel igazolni kell, hogy a cache megmarad, a stale/hiba jelzés
   megjelenik, a legutóbbi próbálkozás frissül, az utolsó siker időpontja és az
   ismert frissítés badge-e pedig megmarad.
8. Produkció előtt véglegesíteni kell a HTTPS endpointot, az ütemezést, a
   forrásonkénti utolsó sikeres adat megőrzését és a hálózati korlátokat. Ezután
   az extension endpointját és hostjogosultságát kell módosítani, a teljes
   automatizált és kézi próbát megismételni, és csak siker után egyesíteni.

A Hibbiki egyforrásos kísérlet 2026-07-17-én a 6–7. lépést is sikeresen
teljesítette: a két engedélyezett letöltés megjelent, szerverkimaradáskor pedig
az extension hibajelzéssel együtt megtartotta az utolsó sikeres adatot.

## Eszközök és letöltések

Ha bármelyik projekt fejlesztése közben hiányzó eszközre, futtatókörnyezetre
vagy függőségre van szükség:

- előre közölni kell a nevét, célját, forrását, kívánt verzióját és azt, hogy
  projektlokális vagy rendszerszintű telepítés lenne;
- a felhasználó engedélyezte a szükséges csomagok és eszközök letöltését;
- telepítés vagy rendszerállapot-módosítás előtt a konkrét műveletet jóvá kell
  hagyatni;
- előnyben kell részesíteni a hivatalos forrást, az ellenőrizhető csomagot, a
  pontos verziót és a projektlokális telepítést;
- ismeretlen eredetű binárist, titkot kérő megoldást vagy indokolatlan globális
  telepítést nem szabad használni.
