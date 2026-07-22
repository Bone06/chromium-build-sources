# Chromium buildforrás-jelöltek — történeti bemenet

Ez a fájl a többforrásos átálláshoz kapott eredeti felhasználói gyűjtést őrzi
letisztított formában. Az átállás elkészült; implementációs vagy biztonsági
szerződésként nem használható. Az aktuálisan támogatott források, platformok és
assetminták kanonikus jegyzéke a `SOURCE_MATRIX.md`.

Az eredeti megjegyzések a korábban megszokott buildjellemzőket és stabilitást
rögzítették. A RobRich CPU- és Linux csomagváltozatai külön buildként
kezelendők. Az eredeti lista nem tartalmazta a később hozzáadott The Chromium
Authors snapshotokat. Win32 és Android szándékosan nem támogatott.

| Repository | Platform | Történeti buildjellemzők | Elfogadott kategóriák |
| --- | --- | --- | --- |
| `Hibbiki/chromium-win64` | Windows x64 | stable, Google Sync, Widevine, All Codecs+ | Archive, Installer |
| `macchrome/winchrome` | Windows x64 | stable, ungoogled, Widevine, All Codecs+ | Archive, Installer |
| `macchrome/macstable` | macOS x64 | stable, ungoogled, Widevine, All Codecs | Archive |
| `macchrome/linchrome` | Linux x64 | stable, ungoogled, Widevine, All Codecs | Archive |
| `RobRich999/Chromium_Clang` | Windows x64 | dev, modified, Widevine, All Codecs+, AVX/AVX2/AVX512 | Archive, Installer |
| `RobRich999/Chromium_Clang` | Linux x64 | dev, modified, Widevine, All Codecs+, AVX/AVX2, DEB/RPM | Package |

A GitHub automatikus Source code archívumai és a Policy templates figyelmen
kívül hagyandók. Új vagy egyedi assetkategória publikálása felhasználói
jóváhagyást igényel.
