# Verified Chromium build source matrix

Mapped on 2026-07-20; extended with Google snapshots on 2026-07-21.
`SOURCE_CANDIDATES.md` is historical user input. This file is the canonical
record of the supported and verified technical patterns.

| Source | Platform | Variants | Tag pattern | Published assets |
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

## Processing decisions

- GitHub `releases/latest` must not be trusted blindly: the release list does
  not guarantee Chromium-version ordering, and the RobRich repository
  publishes variants of one version as separate releases.
- Adapters fetch a recent release list, classify tags strictly, then select the
  newest release for each variant using dotted numeric Chromium versions.
- Release URLs, asset names and download URLs are allowlisted against their
  repository and tag.
- GitHub-generated source code archives and policy templates are excluded. The
  listed Archive, Installer, DEB and RPM packages are approved; publishing any
  other asset requires user approval.
- `macchrome/macstable` is treated as x64. Apple Silicon support is provided by
  the separate Google `Mac_Arm` snapshot.
- Linux AVX512 is not among the approved candidates.
- Popup build tags identify the publisher in addition to familiar build
  characteristics: `hibbiki-…`, `marmaduke-…` or `robrich-…`.

## Observed special cases

- `macchrome/winchrome` may publish a corrected build for the same Chromium
  version using suffixes such as `-2` or `-rev2`. When Chromium versions are
  equal, the newer publication time wins.
- A complete RobRich version cycle contains seven separate builds: Windows
  AVX, AVX2 and AVX512; Linux DEB AVX and AVX2; Linux RPM AVX and AVX2.
- A missing variant must not invalidate successful data from other sources or
  variants.
