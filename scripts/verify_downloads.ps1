# scripts/verify_downloads.ps1
# Verifies downloaded TAR archives and metadata against expected sizes and indexes

param (
    [int]$StartYear = 1950,
    [int]$EndYear = 2026
)

$WORKSPACE = "D:\Projects\pramana"
$META_DIR = Join-Path $WORKSPACE "data\source\metadata_parquet"
$INDEX_DIR = Join-Path $WORKSPACE "data\source\indexes"
$ENG_DIR = Join-Path $WORKSPACE "data\source\english_archives"
$INVENTORY_PATH = Join-Path $WORKSPACE "result\dataset_audit\s3_tar_inventory_parsed.csv"
$VERIFY_REPORT = Join-Path $WORKSPACE "result\dataset_audit\archive_verification.csv"

# Load expected inventory
$expected = @{}
if (Test-Path $INVENTORY_PATH) {
    $inv = Import-Csv $INVENTORY_PATH
    foreach ($row in $inv) {
        if ($row.type -eq "english_tar") {
            $expected[$row.year] = [int64]$row.size_bytes
        }
    }
}

$results = @()
$totalPresent = 0
$totalMissing = 0
$totalBytes = 0

Write-Host "Verifying English TAR archives and metadata ($StartYear - $EndYear)..." -ForegroundColor Cyan

for ($y = $StartYear; $y -le $EndYear; $y++) {
    $tarPath = Join-Path $ENG_DIR "year=$y\english.tar"
    $indexPath = Join-Path $INDEX_DIR "year=$y\english.index.json"
    $parquetPath = Join-Path $META_DIR "year=$y\metadata.parquet"

    $tarExists = Test-Path $tarPath
    $indexExists = Test-Path $indexPath
    $parquetExists = Test-Path $parquetPath

    $tarSize = if ($tarExists) { (Get-Item $tarPath).Length } else { 0 }
    $expSize = if ($expected.ContainsKey("$y")) { $expected["$y"] } else { 0 }
    $sizeMatch = if ($expSize -gt 0 -and $tarExists) { $tarSize -eq $expSize } else { $tarExists }

    $status = if (-not $tarExists) { "MISSING" } elseif (-not $sizeMatch) { "SIZE_MISMATCH" } else { "VERIFIED" }

    if ($tarExists) {
        $totalPresent++
        $totalBytes += $tarSize
    } else {
        $totalMissing++
    }

    $results += [PSCustomObject]@{
        Year = $y
        TarExists = $tarExists
        TarSizeBytes = $tarSize
        ExpectedBytes = $expSize
        SizeMatch = $sizeMatch
        IndexExists = $indexExists
        ParquetExists = $parquetExists
        Status = $status
    }
}

$results | Export-Csv -Path $VERIFY_REPORT -NoTypeInformation -Encoding utf8
Write-Host "Verification report saved to: $VERIFY_REPORT" -ForegroundColor Green
Write-Host "Total Archives Verified: $totalPresent / $($EndYear - $StartYear + 1)" -ForegroundColor Green
Write-Host "Total Downloaded Size: $([math]::Round($totalBytes / 1GB, 2)) GB" -ForegroundColor Green
Write-Host "Total Missing Archives: $totalMissing" -ForegroundColor $(if ($totalMissing -gt 0) { "Yellow" } else { "Green" })
