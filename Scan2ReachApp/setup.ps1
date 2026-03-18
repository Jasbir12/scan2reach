# Scan2Reach App Setup Script
Write-Host "🚀 Setting up Scan2Reach App..." -ForegroundColor Green

# Create all folders
Write-Host "📁 Creating folder structure..." -ForegroundColor Yellow
$folders = @(
    "src",
    "src\screens",
    "src\components", 
    "src\services",
    "src\navigation",
    "src\store",
    "src\types",
    "src\utils",
    "src\assets",
    "android\app\src\main\res\values"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

Write-Host "✅ Folders created!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Next steps:" -ForegroundColor Cyan
Write-Host "1. I will provide you a ZIP file with all source code"
Write-Host "2. Extract it to this folder"
Write-Host "3. Run: npm install"
Write-Host "4. Run: cd android && gradlew clean"
Write-Host "5. Run: npx react-native run-android"
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
