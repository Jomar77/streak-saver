param(
    [switch]$Publish,
    [switch]$SkipZip,
    [string]$Version
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$extensionDir = Join-Path $repoRoot 'tiktok-extension'
$manifestPath = Join-Path $extensionDir 'manifest.json'
$artifactsDir = Join-Path $repoRoot 'artifacts'

if (!(Test-Path $manifestPath)) {
    throw "Could not find manifest at: $manifestPath"
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$manifestVersion = [string]$manifest.version

if ([string]::IsNullOrWhiteSpace($manifestVersion)) {
    throw 'manifest.json version is empty.'
}

if ($Version -and $Version -ne $manifestVersion) {
    throw "Provided -Version '$Version' does not match manifest version '$manifestVersion'."
}

$versionToUse = if ($Version) { $Version } else { $manifestVersion }
$tagName = "v$versionToUse"
$zipName = "tiktok-extension-$tagName.zip"
$zipPath = Join-Path $artifactsDir $zipName

if (!(Test-Path $artifactsDir)) {
    New-Item -ItemType Directory -Path $artifactsDir | Out-Null
}

if (-not $SkipZip) {
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    Compress-Archive -Path (Join-Path $extensionDir '*') -DestinationPath $zipPath -CompressionLevel Optimal
    Write-Host "Created package: $zipPath" -ForegroundColor Green
}

if (-not $Publish) {
    Write-Host ''
    Write-Host 'Package is ready. To publish this version to GitHub Releases:' -ForegroundColor Cyan
    Write-Host "  git add ."
    Write-Host "  git commit -m 'release: $tagName'"
    Write-Host "  git push origin main"
    Write-Host "  git tag $tagName"
    Write-Host "  git push origin $tagName"
    Write-Host ''
    Write-Host 'Pushing the tag triggers .github/workflows/release.yml to create the release asset.' -ForegroundColor Yellow
    exit 0
}

$insideGit = $false
try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -eq 0) {
        $insideGit = $true
    }
} catch {
    $insideGit = $false
}

if (-not $insideGit) {
    throw 'Not inside a git repository. Run this script from the repository root.'
}

$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($currentBranch -ne 'main') {
    throw "Current branch is '$currentBranch'. Switch to 'main' before publishing."
}

git add .

$hasStagedChanges = $false
try {
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
        $hasStagedChanges = $true
    }
} catch {
    throw 'Failed checking staged changes.'
}

if ($hasStagedChanges) {
    git commit -m "release: $tagName"
} else {
    Write-Host 'No staged changes to commit. Continuing with tag/push.' -ForegroundColor Yellow
}

$tagExists = $false
try {
    git rev-parse $tagName *> $null
    if ($LASTEXITCODE -eq 0) {
        $tagExists = $true
    }
} catch {
    $tagExists = $false
}

if ($tagExists) {
    throw "Tag '$tagName' already exists. Choose a new manifest version first."
}

git push origin main
git tag $tagName
git push origin $tagName

Write-Host "Published $tagName. GitHub Actions will build and attach $zipName to the release." -ForegroundColor Green
