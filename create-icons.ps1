# create-icons.ps1
# Creates PWA icons using PowerShell and .NET

Add-Type -AssemblyName System.Drawing

# Create directories
$iconsPath = "public\assets\icons"
$imagesPath = "public\assets\images"
New-Item -ItemType Directory -Force -Path $iconsPath | Out-Null
New-Item -ItemType Directory -Force -Path $imagesPath | Out-Null

Write-Host "📁 Created directories" -ForegroundColor Green

# Icon sizes needed for PWA
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

# Create a simple colored icon with text
function Create-Icon {
    param($size, $path)
    
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Fill background with gradient blue
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($size, $size)),
        [System.Drawing.Color]::FromArgb(66, 133, 244),
        [System.Drawing.Color]::FromArgb(52, 168, 83)
    )
    $graphics.FillRectangle($brush, 0, 0, $size, $size)
    
    # Add white border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 3)
    $graphics.DrawRectangle($pen, 5, 5, $size - 10, $size - 10)
    
    # Add "S2R" text
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $font = New-Object System.Drawing.Font("Arial", ($size / 4), [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $text = "S2R"
    $textSize = $graphics.MeasureString($text, $font)
    $x = ($size - $textSize.Width) / 2
    $y = ($size - $textSize.Height) / 2
    $graphics.DrawString($text, $font, $textBrush, $x, $y)
    
    # Save
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    $graphics.Dispose()
}

# Generate all icon sizes
Write-Host "🎨 Generating icons..." -ForegroundColor Cyan

foreach ($size in $sizes) {
    $filename = "icon-$size.png"
    $filepath = Join-Path $iconsPath $filename
    Create-Icon -size $size -path $filepath
    Write-Host "  ✅ Created $filename" -ForegroundColor Green
}

# Create logo.png (512x512)
$logoPath = "public\assets\logo.png"
Create-Icon -size 512 -path $logoPath
Write-Host "  ✅ Created logo.png" -ForegroundColor Green

Write-Host "`n🎉 All icons created successfully!" -ForegroundColor Green
Write-Host "📂 Location: $iconsPath" -ForegroundColor Yellow