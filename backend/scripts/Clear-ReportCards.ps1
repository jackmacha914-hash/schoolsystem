# Clear-ReportCards.ps1
# This script clears all report cards from the MongoDB database

# MongoDB connection settings
$mongoUri = "mongodb://localhost:27017/SW"
$databaseName = "SW"
$collectionName = "reportcards"

Write-Host "Connecting to MongoDB at $mongoUri..." -ForegroundColor Cyan
Write-Host "WARNING: This will delete ALL documents from the '$collectionName' collection in the '$databaseName' database!" -ForegroundColor Yellow

# Auto-confirm in non-interactive mode
Write-Host "Auto-confirmed operation in non-interactive mode" -ForegroundColor Cyan

# Try to find MongoDB shell in common locations
$mongoshPath = $null
$possiblePaths = @(
    "$env:ProgramFiles\MongoDB\Server\*\bin\mongosh.exe",
    "$env:ProgramFiles\MongoDB\Server\*\bin\mongo.exe",
    "$env:LOCALAPPDATA\Programs\MongoDB\Server\*\bin\mongosh.exe",
    "$env:LOCALAPPDATA\Programs\MongoDB\Server\*\bin\mongo.exe"
)

foreach ($path in $possiblePaths) {
    $foundPath = (Get-Command $path -ErrorAction SilentlyContinue).Source
    if ($foundPath) {
        $mongoshPath = $foundPath
        break
    }
}

if (-not $mongoshPath) {
    Write-Host "MongoDB shell not found. Please ensure MongoDB is installed and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Using MongoDB shell at: $mongoshPath" -ForegroundColor Cyan

# JavaScript command to execute
$jsCommand = @"
db = db.getSiblingDB('$databaseName');
var result = db.$collectionName.deleteMany({});
print(JSON.stringify({nRemoved: result.deletedCount}));
"@

# Temporary file to hold the JavaScript command
$tempJsFile = [System.IO.Path]::GetTempFileName() + ".js"
$jsCommand | Out-File -FilePath $tempJsFile -Encoding ascii

try {
    Write-Host "Deleting all report cards..." -ForegroundColor Cyan
    
    # Execute the MongoDB command
    $result = & $mongoshPath --quiet $mongoUri $tempJsFile | ConvertFrom-Json
    
    if ($result) {
        Write-Host "Successfully cleared all report cards from the database." -ForegroundColor Green
        Write-Host "Number of documents deleted: $($result.nRemoved)" -ForegroundColor Green
    } else {
        Write-Host "No documents were deleted. The collection might be empty." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "An error occurred while clearing report cards:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Make sure MongoDB is installed and the 'mongo' command is available in your PATH." -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..." -NoNewline
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
