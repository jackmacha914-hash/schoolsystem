$filePath = "c:\Users\HP\SW123\SW12\frontend\js\take-quiz.js"
$content = Get-Content -Path $filePath -Raw

# Replace the const declaration with an assignment to the outer scope variable
$newContent = $content -replace 'const\s+navigateToQuestion\s*=\s*\(index\)\s*=>', 'navigateToQuestion = (index) =>'

# Write the fixed content back to the file
$newContent | Set-Content -Path $filePath -NoNewline

Write-Host "Fixed duplicate navigateToQuestion declarations"
