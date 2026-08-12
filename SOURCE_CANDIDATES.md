# Chromium build source candidates — historical input

This file preserves, in a cleaned-up form, the original source list collected
for the multi-source migration. The migration is complete; this file is not an
implementation or security contract. `SOURCE_MATRIX.md` is the canonical list
of currently supported sources, platforms and asset patterns.

The original notes recorded the previously familiar build characteristics and
stability expectations. RobRich CPU and Linux package variants must be treated
as separate builds. The original list did not contain The Chromium Authors
snapshots, which were added later. Win32 and Android are intentionally not
supported.

| Repository | Platform | Historical build characteristics | Accepted categories |
| --- | --- | --- | --- |
| `Hibbiki/chromium-win64` | Windows x64 | stable, Google Sync, Widevine, All Codecs+ | Archive, Installer |
| `macchrome/winchrome` | Windows x64 | stable, ungoogled, Widevine, All Codecs+ | Archive, Installer |
| `macchrome/macstable` | macOS x64 | stable, ungoogled, Widevine, All Codecs | Archive |
| `macchrome/linchrome` | Linux x64 | stable, ungoogled, Widevine, All Codecs | Archive |
| `RobRich999/Chromium_Clang` | Windows x64 | dev, modified, Widevine, All Codecs+, AVX/AVX2/AVX512 | Archive, Installer |
| `RobRich999/Chromium_Clang` | Linux x64 | dev, modified, Widevine, All Codecs+, AVX/AVX2, DEB/RPM | Package |

GitHub-generated source code archives and policy templates must be ignored.
Publishing a new or custom asset category requires user approval.
