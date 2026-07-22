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

## Befagyasztott feed v1 szerződés

A `schemaVersion: 1` feed gyökérmezői:

```text
schemaVersion: 1
generatedAt: UTC ISO 8601
sources: source rekordok tömbje
builds: build rekordok tömbje
```

A source rekord pontos kötelező mezői:

```text
id, name, repository, checkedAt, lastSuccessAt, stale, error
```

A build rekord kötelező és opcionális mezőinek jelentése:

- buildazonosító
- platform és architektúra
- build tag/csatorna
- opcionális, felhasználónak szánt `displayName`; a tartós kiválasztás kulcsa
  továbbra is a stabil `tag`
- Chromium-verzió
- revision, ha a forrás biztosítja
- kiadási idő
- forrásnév, repository és release provenance
- letöltési assetek címkével, HTTPS URL-lel, mérettel és opcionális checksum-mal
- forrásonkénti utolsó próbálkozás, utolsó siker, stale állapot és hiba
- kötelező `capabilities` objektum: official, Sync, proprietary codecs és
  Widevine logikai értékek

Minden időpont szabványos UTC ISO 8601 szöveg legyen. A verziókat szemantikailag
nem szabad egyszerű szövegrendezéssel összehasonlítani.

## Támogatott források

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
- A további támogatott GitHub- és Google-forrásokat a `SOURCE_MATRIX.md`
  kanonikus mátrixa rögzíti.

## Többforrásos implementáció

A felhasználói forráslista a `SOURCE_CANDIDATES.md`, az ellenőrzött technikai
release-, tag- és assetmátrix a `SOURCE_MATRIX.md` fájlban található. A Hibbiki
mellett a macchrome Windows, macOS és Linux repositoryi, valamint a RobRich
Windows AVX/AVX2/AVX512 és Linux DEB/RPM AVX/AVX2 változatai támogatottak.

### Google Storage Chromium snapshotok

A `chromium-browser-snapshots` bucketből kizárólag a `Win_x64`, `Win_Arm64`,
`Mac`, `Mac_Arm` és `Linux_x64` platformprefix engedélyezett. Platformonként a
`LAST_CHANGE` adja a commit positiont, a revisionkönyvtár `REVISIONS` fájlja a
pontos Chromium Git commitot, annak `chrome/VERSION` fájlja pedig a verziót.

- Windows x64/ARM64: `chrome-win.zip` Archive és `mini_installer.exe` Installer.
- macOS Intel/ARM: `chrome-mac.zip` Archive.
- Linux x64: `chrome-linux.zip` Archive.
- Android, ChromeOS/Lacros, symbol-, driver-, content-shell-, updater- és
  tesztcsomagok nem publikálhatók.
- A snapshot development adat, nem stabil kiadás. Hiányos legújabb könyvtár
  forráshibának számít, és a korábbi sikeres platformadatot kell megtartani.

## Nem alku tárgya

- Az upstream válaszok nem megbízható adatok.
- Repository-, tag-, asset- és URL-engedélylista szükséges.
- Csak HTTPS letöltési link publikálható.
- Egy hibás forrás nem törölheti más forrás vagy saját korábbi sikeres adatát.
- Korábban sikeres forrás hibájakor annak source rekordja `stale: true` és
  rövid hibaüzenet mellett megőrzi a `lastSuccessAt` értéket és korábbi
  buildjeit. Még soha nem sikeres forrás kimarad a feedből, de nem akadályozza
  a többi publikálását. Ha nincs egyetlen sikeres vagy cache-elt build sem, a
  korábbi feedfájlt nem szabad felülírni.
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
   aktuális fejlesztési változatával kipróbálni. Ellenőrizendő a popup, a linkek, a platform/tag
   választás, a verzió-összehasonlítás és a badge.
7. Egy sikeres lekérés után a szervert le kell állítani, majd `Check now`
   művelettel igazolni kell, hogy a cache megmarad, a stale/hiba jelzés
   megjelenik, a legutóbbi próbálkozás frissül, az utolsó siker időpontja és az
   ismert frissítés badge-e pedig megmarad.
8. Produkció előtt véglegesíteni kell a HTTPS endpointot, az ütemezést, a
   forrásonkénti utolsó sikeres adat megőrzését és a hálózati korlátokat. Ezután
   az extension endpointját és hostjogosultságát kell módosítani, a teljes
   automatizált és kézi próbát megismételni, és csak siker után egyesíteni.

## Produkciós cache és további védelem

A generátor a `PREVIOUS_FEED_URL` HTTPS címen letöltheti és validálhatja az
előző publikált feedet. Sikertelenségkor a validált helyi `dist/versions.json`
a tartalék; az új feed ideiglenes fájlon keresztül, atomikusan cserélődik.
Mind a távoli, mind a helyi előző feed csak a hozzá tartozó, megbízható kulccsal
érvényesen aláírt `.sig` sidecarral használható. Hiányzó, hibás, ismeretlen
kulcsú vagy más feed bájtjaihoz tartozó aláírás esetén a cache elutasítandó;
így a hosting nem tud manipulált adatot az aggregátor saját aláírása alá mosni.

Az extensionben az azonos verzión belüli új snapshot revision értesítése külön,
alapértelmezetten kikapcsolt beállítás. A kiválasztott buildhez utoljára látott
revision lokálisan tárolódik; a popup megnyitása nyugtázás.

A v1 szerződést a `schema/feed-v1.schema.json` teljes, `additionalProperties:
false` JSON Schema és a két projekt futásidejű validátorai rögzítik.
Inkompatibilis mező- vagy jelentésváltozás új `schemaVersion` értéket igényel.

Minden `versions.json` mellett kötelező a pontos bájtjaira készült
`versions.json.sig`. Formátumát a `feed-signature-v1.schema.json` rögzíti:
ECDSA P-256/SHA-256, IEEE P1363 formátumú leválasztott aláírás és `keyId`.
Az extension a JSON feldolgozása előtt ellenőrzi az aláírást a beépített
publikus kulccsal, és elutasítja a korábbi `generatedAt` értékre történő
visszaállást. A privát kulcs nem kerülhet repositoryba vagy hostingra.
Kulcsrotációnál előbb olyan extensiont kell kiadni, amely már bízik az új
publikus kulcsban, és csak utána válthat az aggregátor az új privát kulcsra.

Kiadási szabály: minden új nyilvános extension-kiadáshoz új feedkulcspárt kell
előkészíteni. Az N. kiadás az aktuális `K_N` és a következő `K_N+1` publikus
kulcsot is tartalmazza, miközben a feedet még `K_N` írja alá. Az N+1. kiadás
már `K_N+1` és `K_N+2` kulcsban bízik; a feed csak ezután válthat `K_N+1`
aláírásra. A lejárt privát kulcsot az átállási idő után offline archiválni vagy
megsemmisíteni kell, aktív generálási környezetben nem maradhat. Így egy régi
kulcs kompromittálódása nem terjed át az új extension-kiadásokra. A régi,
kompromittált kulcsban továbbra is bízó telepítéseket csak extension-frissítés
védi meg; ezt pusztán a feedoldalon nem lehet visszamenőleg megoldani.

Hátralévő üzemeltetési feladat az ETag / `If-None-Match` használata, valamint
egy publikálás előtti produkciós smoke test az extension saját feedvalidátorával.

## Dokumentáció

A teljes nyilvános dokumentáció angol nyelvre fordítása hátralévő open-source
kiadási feladat. Az angol változatnak kell elsődlegesnek és teljesnek lennie;
a magyar belső kontextus addig fenntartható, amíg nem ez az egyetlen nyilvános
magyarázat egy felhasználói vagy fejlesztői folyamathoz.

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
