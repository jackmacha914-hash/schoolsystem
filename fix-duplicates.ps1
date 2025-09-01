$filePath = "c:\Users\HP\SW123\SW12\frontend\js\take-quiz.js"
$content = Get-Content -Path $filePath -Raw

# Replace all const declarations of navigateToQuestion with assignments
$newContent = $content -replace 'const\s+navigateToQuestion\s*=\s*\(index\)\s*=>', 'navigateToQuestion = (index) =>'

# Write the fixed content back to the file
$newContent | Set-Content -Path $filePath -NoNewline

Write-Host "Fixed all navigateToQuestion declarations"
