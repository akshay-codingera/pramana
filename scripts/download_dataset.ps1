# scripts/download_dataset.ps1
# PRAMANA: Resumable, robust downloader for Indian Supreme Court Judgments from AWS S3
# Downloads:
# 1. Complete metadata Parquet files (1950-2026) -> data/source/metadata_parquet/
# 2. Complete TAR index JSON files (1950-2026) -> data/source/indexes/
# 3. Complete English TAR archives (1950-2026) -> data/source/english_archives/

param (
    [switch]$MetadataOnly = $false,
    [switch]$DryRun = $false,
    [int]$StartYear = 1950,
    [int]$EndYear = 2026
)

$ErrorActionPreference = "Continue"

$WORKSPACE = "D:\Projects\pramana"
$META_DIR = Join-Path $WORKSPACE "data\source\metadata_parquet"
$INDEX_DIR = Join-Path $WORKSPACE "data\source\indexes"
$ENG_DIR = Join-Path $WORKSPACE "data\source\english_archives"
$MANIFEST_PATH = Join-Path $WORKSPACE "data\source\download_manifest.csv"

# Ensure directories exist
@($META_DIR, $INDEX_DIR, $ENG_DIR) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

# Initialize manifest if missing
if (-not (Test-Path $MANIFEST_PATH)) {
    "year,archive_name,archive_type,source_s3,local_path,expected_size,downloaded_size,download_status,timestamp" | Out-File -FilePath $MANIFEST_PATH -Encoding utf8
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "PRAMANA RESUMABLE DATASET ACQUISITION" -ForegroundColor Cyan
Write-Host "Source S3: s3://indian-supreme-court-judgments/" -ForegroundColor Cyan
Write-Host "Destination: $WORKSPACE\data\source\" -ForegroundColor Cyan
Write-Host "Years Range: $StartYear to $EndYear" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

function Download-S3File {
    param (
        [string]$S3Uri,
        [string]$LocalFile,
        [int64]$ExpectedSize,
        [string]$Year,
        [string]$ArchiveName,
        [string]$ArchiveType
    )

    $parentDir = Split-Path -Parent $LocalFile
    if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }

    # Check if already completely downloaded
    if (Test-Path $LocalFile) {
        $actualSize = (Get-Item $LocalFile).Length
        if ($ExpectedSize -gt 0 -and $actualSize -eq $ExpectedSize) {
            Write-Host "[SKIP - COMPLETED] $ArchiveName ($([math]::Round($actualSize/1MB, 2)) MB)" -ForegroundColor Green
            return $true
        } elseif ($ExpectedSize -eq 0 -and $actualSize -gt 0) {
            Write-Host "[SKIP - EXISTS] $ArchiveName" -ForegroundColor Green
            return $true
        }
    }

    if ($DryRun) {
        Write-Host "[DRY RUN] Would download $S3Uri -> $LocalFile" -ForegroundColor Yellow
        return $true
    }

    $retries = 3
    $success = $false
    for ($attempt = 1; $attempt -le $retries; $attempt++) {
        Write-Host "[DOWNLOADING ($attempt/$retries)] $ArchiveName..." -ForegroundColor White
        $startTime = Get-Date

        # Run aws s3 cp with --no-sign-request
        & aws s3 cp $S3Uri $LocalFile --no-sign-request

        if ($LASTEXITCODE -eq 0 -and (Test-Path $LocalFile)) {
            $downloadedSize = (Get-Item $LocalFile).Length
            if ($ExpectedSize -gt 0 -and $downloadedSize -ne $ExpectedSize) {
                Write-Host "[SIZE MISMATCH] Expected: $ExpectedSize, Got: $downloadedSize. Retrying..." -ForegroundColor Red
                Remove-Item $LocalFile -Force -ErrorAction SilentlyContinue
            } else {
                $duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
                $speed = if ($duration -gt 0) { [math]::Round(($downloadedSize/1MB)/$duration, 2) } else { 0 }
                Write-Host "[SUCCESS] $ArchiveName ($([math]::Round($downloadedSize/1MB, 2)) MB in ${duration}s, ${speed} MB/s)" -ForegroundColor Green
                $success = $true
                
                # Append to manifest
                $logLine = "$Year,$ArchiveName,$ArchiveType,$S3Uri,$LocalFile,$ExpectedSize,$downloadedSize,COMPLETED,$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
                Add-Content -Path $MANIFEST_PATH -Value $logLine
                break
            }
        } else {
            Write-Host "[FAILED ATTEMPT $attempt] Error downloading $S3Uri" -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }

    if (-not $success) {
        Write-Host "[ERROR] Failed to download $ArchiveName after $retries attempts!" -ForegroundColor Red
        $logLine = "$Year,$ArchiveName,$ArchiveType,$S3Uri,$LocalFile,$ExpectedSize,0,FAILED,$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
        Add-Content -Path $MANIFEST_PATH -Value $logLine
        return $false
    }
    return $true
}

# 1. Download Metadata Parquet files
Write-Host "`n--- STAGE 1: Downloading Metadata Parquet Files (1950-$EndYear) ---" -ForegroundColor Cyan
for ($y = $StartYear; $y -le $EndYear; $y++) {
    $s3Parquet = "s3://indian-supreme-court-judgments/metadata/parquet/year=$y/metadata.parquet"
    $localParquet = Join-Path $META_DIR "year=$y\metadata.parquet"
    Download-S3File -S3Uri $s3Parquet -LocalFile $localParquet -ExpectedSize 0 -Year $y -ArchiveName "metadata_year=$y.parquet" -ArchiveType "metadata_parquet" | Out-Null
}

# 2. Download Archive Indexes
Write-Host "`n--- STAGE 2: Downloading Index JSON Files (1950-$EndYear) ---" -ForegroundColor Cyan
for ($y = $StartYear; $y -le $EndYear; $y++) {
    $s3Index = "s3://indian-supreme-court-judgments/data/tar/year=$y/english/english.index.json"
    $localIndex = Join-Path $INDEX_DIR "year=$y\english.index.json"
    Download-S3File -S3Uri $s3Index -LocalFile $localIndex -ExpectedSize 0 -Year $y -ArchiveName "english.index_year=$y.json" -ArchiveType "index_json" | Out-Null
}

if ($MetadataOnly) {
    Write-Host "`n[COMPLETED] Metadata & Index download finished (-MetadataOnly specified)." -ForegroundColor Green
    exit 0
}

# 3. Download English TAR Archives
Write-Host "`n--- STAGE 3: Downloading English TAR Archives (1950-$EndYear) ---" -ForegroundColor Cyan

# Load S3 inventory to get expected sizes
$inventoryFile = Join-Path $WORKSPACE "result\dataset_audit\s3_tar_inventory_parsed.csv"
$expectedSizes = @{}
if (Test-Path $inventoryFile) {
    $csv = Import-Csv $inventoryFile
    foreach ($row in $csv) {
        if ($row.type -eq "english_tar") {
            $expectedSizes[$row.year] = [int64]$row.size_bytes
        }
    }
}

$totalDownloadedThisRun = 0
for ($y = $StartYear; $y -le $EndYear; $y++) {
    # Check current free disk space before each download
    $dDrive = Get-PSDrive -Name "D"
    $freeGB = [math]::Round($dDrive.Free / 1GB, 2)
    if ($freeGB -lt 15.0) {
        Write-Host "`n[STORAGE SAFETY HALT] Free disk space on Drive D: is down to $freeGB GB (< 15 GB threshold)! Halting downloads." -ForegroundColor Red
        exit 1
    }

    $expSize = if ($expectedSizes.ContainsKey("$y")) { $expectedSizes["$y"] } else { 0 }
    $s3Tar = "s3://indian-supreme-court-judgments/data/tar/year=$y/english/english.tar"
    $localTar = Join-Path $ENG_DIR "year=$y\english.tar"

    $res = Download-S3File -S3Uri $s3Tar -LocalFile $localTar -ExpectedSize $expSize -Year $y -ArchiveName "english_year=$y.tar" -ArchiveType "english_tar"
    if (-not $res) {
        Write-Host "[WARNING] Year $y download had issues, continuing with remaining years..." -ForegroundColor Yellow
    }
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "DOWNLOAD PROCESS COMPLETE" -ForegroundColor Cyan
Write-Host "Manifest saved to: $MANIFEST_PATH" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
