# Chromium buildforrás-jelöltek

## Fontos információk:
- a Megjegyzés rovatba az egykori Woolyss tag-eket tettem, kiegészítve a build stabilitás megjelölésével, például Stable, Dev, Canary
- RobRich999 Repositoryknál létezik külön avx2, avx, avx512. Ezek külön kezelendőek.
- Robrick999 Repositoryknál a megyjegyzést kiegészítettem: Deb, Rpm. Ezek külön kezelendőek, linux package managert határoz meg.
- A lista nem teljes: 
    - Láthatóan hiányoznak belőle a The Chromium Authors buildek. Ezek más repsitory-t használnak, melyre teszt még nem készült, ez a jövőben szükséges lesz
    -Korábban létező patformok hiányoznak, például Win32, Android. Ezekre a jövőben sem lesz szükség. Oka: Android: irreleváns buildek, Win32: feljesztés végleg befejezve

## Windows x64

- Repository: https://github.com/Hibbiki/chromium-win64/
- Megjegyzés: Hibikki, Stable, Google sync, Widewinve, All-Codecs+, Win64 
- Ismert letöltések:
  - Archive
  - Installer
- Figyelmen kívül hagyható assetek:
  - Policy Template
  - Source Code

-  Repository: https://github.com/macchrome/winchrome
- Megjegyzés: Marmaduke, Stable, Ungoogled, Widewinve, All-Codecs+, Win64 
- Ismert letöltések:
  - Archive
  - Installer
- Figyelmen kívül hagyható assetek:
  - Source Code
  
- Repository: https://github.com/RobRich999/Chromium_Clang/
- Megjegyzés: RobRich, Dev, AVX2, Modified, Widevine, All-Codecs+, Win64 
- Ismert letöltések:
  - Archive
  - Installer
- Figyelmen kívül hagyható assetek:
  - Source Code

- Repository: https://github.com/RobRich999/Chromium_Clang/
- Megjegyzés: RobRich, Dev, AVX, Modified, Widevine, All-Codecs+, Win64 
- Ismert letöltések:
  - Archive
  - Installer
- Figyelmen kívül hagyható assetek:
  - Source Code

- Repository: https://github.com/RobRich999/Chromium_Clang/
- Megjegyzés: RobRich, Dev, AVX512, Modified, Widevine, All-Codecs+, Win64 
- Ismert letöltések:
  - Archive
  - Installer
- Figyelmen kívül hagyható assetek:
  - Source Code

## 64-bit macOS

- Repository: https://github.com/macchrome/macstable
- Megjegyzés: Marmaduke, Stable, Ungoogled, Widevine, All-Codecs, Mac 
- Ismert letöltések:
  - Archive
- Figyelmen kívül hagyható assetek:
  - Source Code


## 64-bit Linux
- Repository: https://github.com/macchrome/linchrome
- Megjegyzés: Marmaduke, Stable, Ungoogled, Widevine, All-Codecs, Linux 
- Ismert letöltések:
  - Archive
- Figyelmen kívül hagyható assetek:
  - Source Code

- Repository: https://github.com/RobRich999/Chromium_Clang/
- Megjegyzés: RobRich, Dev, AVX2, Modified, Widevine, All-Codecs+, Linux, Deb
- Ismert letöltések:
  - Package
- Figyelmen kívül hagyható assetek:
  - Source Code

- Repository: https://github.com/RobRich999/Chromium_Clang/
- Megjegyzés: RobRich, Dev, AVX, Modified, Widevine, All-Codecs+, Linux, Deb
- Ismert letöltések:
  - Package
- Figyelmen kívül hagyható assetek:
  - Source Code

- Repository: https://github.com/RobRich999/Chromium_Clang/
- Megjegyzés: RobRich, Dev, AVX2, Modified, Widevine, All-Codecs+, Linux, Rpm
- Ismert letöltések:
  - Package
- Figyelmen kívül hagyható assetek:
  - Source Code

- Repository: https://github.com/RobRich999/Chromium_Clang/
- Megjegyzés: RobRich, Dev, AVX, Modified, Widevine, All-Codecs+, Linux, Rpm
- Ismert letöltések:
  - Package
- Figyelmen kívül hagyható assetek:
  - Source Code