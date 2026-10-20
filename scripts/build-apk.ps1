# BATEO — Android APK derleme yardımcısı
# Kullanım: powershell -ExecutionPolicy Bypass -File scripts\build-apk.ps1
# (npm run android:apk bu betiği çağırır)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

# JDK (zip ile kurulduysa) ve Android SDK yollarını bul
$jdkCandidates = @(
  "$env:LOCALAPPDATA\bateo-dev\jdk",
  "C:\Program Files\Android\Android Studio\jbr"
)
$sdkCandidates = @(
  "$env:LOCALAPPDATA\Android\Sdk",
  "$env:ANDROID_HOME",
  "$env:ANDROID_SDK_ROOT"
)

$jdk = $jdkCandidates | Where-Object { $_ -and (Test-Path (Join-Path $_ "bin\java.exe")) } | Select-Object -First 1
$sdk = $sdkCandidates | Where-Object { $_ -and (Test-Path (Join-Path $_ "platform-tools")) } | Select-Object -First 1

if (-not $jdk) { Write-Host "JDK bulunamadi. Android Studio kur veya %LOCALAPPDATA%\bateo-dev\jdk kullan." -ForegroundColor Red; exit 1 }
if (-not $sdk) { Write-Host "Android SDK bulunamadi." -ForegroundColor Red; exit 1 }

$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk

# local.properties (sdk.dir)
"sdk.dir=" + ($sdk -replace '\\', '/') | Set-Content -Path (Join-Path $root "android\local.properties") -Encoding ASCII

Write-Host "JAVA_HOME = $jdk"
Write-Host "ANDROID_HOME = $sdk"
Write-Host "Gradle derlemesi basliyor..." -ForegroundColor Cyan

Push-Location (Join-Path $root "android")
& .\gradlew.bat assembleDebug --console=plain
$code = $LASTEXITCODE
Pop-Location

$apk = Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
  Write-Host ""
  Write-Host "APK hazir: $apk" -ForegroundColor Green
  Write-Host "Telefona kurmak icin: adb install -r `"$apk`"" -ForegroundColor Green
}
exit $code
