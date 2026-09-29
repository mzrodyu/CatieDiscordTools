#Requires -Version 5.1
<#
  Build HalcyonInstaller.exe from HalcyonInstaller.ps1 using the ps2exe module.

  Usage (Windows PowerShell 5.1 recommended, so the exe hosts the 5.1 engine):
      powershell -NoProfile -ExecutionPolicy Bypass -File installer\build.ps1
  or  npm run build:installer

  Produces installer\dist\HalcyonInstaller.exe. No admin required.
#>
[CmdletBinding()]
param(
    [string]$OutDir,
    [switch]$SkipModuleInstall
)
$ErrorActionPreference = 'Stop'

# $PSScriptRoot is populated in the script body but NOT inside param() defaults,
# so resolve the output dir here instead of in the param block.
if (-not $OutDir) { $OutDir = Join-Path $PSScriptRoot 'dist' }

$src = Join-Path $PSScriptRoot 'HalcyonInstaller.ps1'
if (-not (Test-Path -LiteralPath $src)) { throw "source not found: $src" }

# --- ensure the ps2exe module is available -----------------------------------
# Saved into installer\.tools rather than installed to CurrentUser: the user's
# Documents\WindowsPowerShell module path can be redirected to a folder that does
# not exist (OneDrive / relocated Documents), which breaks Install-Module.
if (-not (Get-Command Invoke-ps2exe -ErrorAction SilentlyContinue)) {
    $toolsDir = Join-Path $PSScriptRoot '.tools'
    $modRoot  = Join-Path $toolsDir 'ps2exe'
    $psd1 = $null
    if (Test-Path -LiteralPath $modRoot) {
        $psd1 = Get-ChildItem -LiteralPath $modRoot -Recurse -Filter 'ps2exe.psd1' -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    if (-not $psd1) {
        if ($SkipModuleInstall) { throw 'ps2exe is not available and -SkipModuleInstall was set.' }
        Write-Host 'Fetching ps2exe into installer\.tools ...'
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        if (-not (Get-PackageProvider -Name NuGet -ErrorAction SilentlyContinue)) {
            Install-PackageProvider -Name NuGet -Scope CurrentUser -Force | Out-Null
        }
        if (-not (Test-Path -LiteralPath $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null }
        Save-Module -Name ps2exe -Path $toolsDir -Force
        $psd1 = Get-ChildItem -LiteralPath $modRoot -Recurse -Filter 'ps2exe.psd1' -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    if (-not $psd1) { throw 'could not obtain the ps2exe module.' }
    Import-Module $psd1.FullName -ErrorAction Stop
}

# --- 4-part numeric FileVersion from package.json (e.g. 0.7.11 -> 0.7.11.0) ---
$version = '0.0.0.0'
try {
    $pkg = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\package.json') | ConvertFrom-Json
    $nums = @(($pkg.version -replace '[^0-9.]', '').Split('.') | Where-Object { $_ -ne '' })
    while ($nums.Count -lt 4) { $nums += '0' }
    $version = ($nums[0..3] -join '.')
} catch { Write-Warning "could not read version from package.json: $($_.Exception.Message)" }

if (-not (Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
$out  = Join-Path $OutDir 'HalcyonInstaller.exe'
$icon = Join-Path $PSScriptRoot 'assets\halcyon.ico'

# $args collides with the automatic variable — never use it for the splat.
$ps2exeArgs = @{
    inputFile   = $src
    outputFile  = $out
    noConsole   = $true      # WinForms GUI, not a console app
    STA         = $true      # WinForms requires a single-threaded apartment
    x64         = $true
    title       = 'Halcyon Installer'
    description = 'One-click installer for the Halcyon Discord client mod'
    company     = 'Halcyon'
    product     = 'Halcyon'
    version     = $version
    # NOTE: deliberately NO requireAdmin — all writes live under %LOCALAPPDATA% /
    # %APPDATA% and the logon task is per-user, so elevation is never needed.
}
if (Test-Path -LiteralPath $icon) { $ps2exeArgs.iconFile = $icon }

Write-Host "Building $out  (v$version)"
Invoke-ps2exe @ps2exeArgs
Write-Host 'Done. Share installer\dist\HalcyonInstaller.exe, or the raw .ps1 + run.cmd.'
