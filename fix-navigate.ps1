$filePath = "c:\Users\HP\SW123\SW12\frontend\js\take-quiz.js"
$content = Get-Content -Path $filePath -Raw

# Replace all instances of 'const navigateToQuestion = (index) =>' with 'navigateToQuestion = (index) =>'
$newContent = $content -replace 'const\s+navigateToQuestion\s*=\s*\(index\)\s*=>', 'navigateToQuestion = (index) =>'

# Write the fixed content back to the file
[System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.Encoding]::UTF8)

Write-Host "Fixed navigateToQuestion declarations"
