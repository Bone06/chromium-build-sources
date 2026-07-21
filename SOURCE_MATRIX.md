# Ellenőrzött Chromium buildforrás-mátrix

Feltérképezve: 2026-07-20; Google snapshotokkal bővítve: 2026-07-21. A
`SOURCE_CANDIDATES.md` felhasználói bemenet; ez a fájl a ténylegesen ellenőrzött
technikai mintákat rögzíti.

| Forrás | Platform | Változatok | Tagminta | Publikált assetek |
| --- | --- | --- | --- | --- |
| `Hibbiki/chromium-win64` | Windows x64 | stable, Sync, Widevine, codecs | `v<version>-r<revision>` | `chrome.7z`, `mini_installer.exe` |
| `macchrome/winchrome` | Windows x64 | stable, ungoogled, Widevine, codecs | `v<short>-M<version>-r<revision>-Win64<suffix>` | `*_ungoogled_mini_installer.exe`, `ungoogled-chromium-*_Win64.7z` |
| `macchrome/macstable` | macOS x64 | stable, ungoogled, Widevine, codecs | `v<short>-M<version>-r<revision>-macOS` | `Chromium.app.ungoogled-<version>.tar.xz` |
| `macchrome/linchrome` | Linux x64 | stable, ungoogled, Widevine, codecs | `v<short>-M<version>-r<revision>-portable-ungoogled-Lin64` | `ungoogled-chromium_<version>_*.vaapi_linux.tar.xz` |
| `RobRich999/Chromium_Clang` | Windows x64 | dev, modified, AVX/AVX2/AVX512 | `v<version>-r<revision>-win64-<cpu>` | `chrome.zip`, `mini_installer.exe` |
| `RobRich999/Chromium_Clang` | Linux x64 | dev, modified, AVX/AVX2, DEB/RPM | `v<version>-r<revision>-linux64-<package>-<cpu>` | `Package (deb)` / `Package (rpm)` → `chromium-browser-unstable*.<deb|rpm>` |
| Google Chromium snapshots | Windows x64 | main snapshot | `Win_x64/<commit-position>` | `chrome-win.zip`, `mini_installer.exe` |
| Google Chromium snapshots | Windows ARM64 | main snapshot | `Win_Arm64/<commit-position>` | `chrome-win.zip`, `mini_installer.exe` |
| Google Chromium snapshots | macOS x64 | main snapshot | `Mac/<commit-position>` | `chrome-mac.zip` |
| Google Chromium snapshots | macOS ARM64 | main snapshot | `Mac_Arm/<commit-position>` | `chrome-mac.zip` |
| Google Chromium snapshots | Linux x64 | main snapshot | `Linux_x64/<commit-position>` | `chrome-linux.zip` |

## Feldolgozási döntések

- Nem használható vakon a GitHub `releases/latest`: a release-lista nem
  garantál Chromium-verzió szerinti sorrendet, a RobRich repository pedig egy
  verzió variánsait külön release-ekben közli.
- Az adapterek közelmúltbeli release-listát kérnek le, szigorúan osztályozzák a
  tageket, majd pontozott numerikus Chromium-verzió szerint választják ki a
  legújabb kiadást variánsonként.
- A release URL, assetnév és letöltési URL repositoryhoz és taghez kötött
  engedélylistás ellenőrzést kap.
- A GitHub automatikus Source code archívumai és a Policy templates kimaradnak.
  A felsorolt Archive, Installer, DEB és RPM csomagok engedélyezettek; más asset
  csak felhasználói jóváhagyás után publikálható.
- A macOS forrás jelenleg x64-ként kezelendő. Apple Silicon változat nem
  vehető fel automatikusan.
- Linux AVX512 nincs a jóváhagyott jelöltek között.
- A popupban megjelenő buildtagek a Woolyss-féle jellemzők mellett a build
  készítőjét is tartalmazzák: `hibbiki-…`, `marmaduke-…` vagy `robrich-…`.

## Megfigyelt különlegességek

- A `macchrome/winchrome` ugyanahhoz a Chromium-verzióhoz javított buildet is
  kiadhat (`-2`, `-rev2` jellegű suffix). Azonos Chromium-verziónál a frissebb
  publikálási idő választandó.
- A RobRich hét külön buildet ad egy teljes verziókörben: Windows AVX, AVX2 és
  AVX512; Linux DEB AVX és AVX2; Linux RPM AVX és AVX2.
- Egy hiányzó variáns nem teheti használhatatlanná a többi forrás vagy variáns
  sikeres adatát.
