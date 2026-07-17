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

## Tervezett minimális feed-szerződés

A végleges séma még tervezés alatt áll. Legalább az alábbi jelentést kell
lefednie:

- `schemaVersion`
- `generatedAt`
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
- Ismert assetek: `chrome.7z`, `mini_installer.exe`,
  `policy_templates.zip`.
- Ez önmagában nem helyettesíti a Woolyss teljes platformlistáját.

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
