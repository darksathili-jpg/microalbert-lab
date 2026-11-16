param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Lancer', 'Configurer')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'
$profilePath = Join-Path $env:LOCALAPPDATA 'MicroAlbertAutonome'
$configPath = Join-Path $profilePath 'albert.json'

function Get-PlainText([Security.SecureString]$Value) {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

if ($Action -eq 'Configurer') {
    Write-Host 'Configuration de MicroAlbert pour ce compte Windows'
    Write-Host '[1] Enregistrer ou remplacer la clé Albert'
    Write-Host '[2] Retirer la clé et utiliser l''aide locale'
    $choice = Read-Host 'Choix'
    if ($choice -eq '2') {
        if (Test-Path -LiteralPath $configPath) { Remove-Item -LiteralPath $configPath }
        Write-Host 'Clé locale retirée. Relancez MicroAlbert.'
        exit 0
    }
    if ($choice -ne '1') { exit 0 }

    $key = Read-Host 'Collez la clé Albert, sans le mot Bearer' -AsSecureString
    if ($key.Length -eq 0) {
        Write-Host 'Aucune clé saisie.'
        exit 1
    }
    $model = (Read-Host 'Identifiant exact d’un modèle de génération de texte').Trim()
    $approved = Read-Host 'Tapez OUI si vous avez vérifié la gratuité et le quota disponible de ce modèle'
    if ($approved -cne 'OUI') {
        Write-Host 'Configuration précédente conservée.'
        exit 1
    }

    if ([string]::IsNullOrWhiteSpace($model)) {
        Write-Host 'Aucun modèle sélectionné. La configuration précédente est conservée.'
        exit 1
    }
    New-Item -ItemType Directory -Path $profilePath -Force | Out-Null
    @{ cle = (ConvertFrom-SecureString $key); modele = $model; quotaVerifie = $true } |
        ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8
    Write-Host 'Configuration enregistrée pour ce compte Windows. Fermez puis relancez MicroAlbert.'
    exit 0
}

$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
$server = Join-Path $PSScriptRoot 'atelier.mjs'
if (-not $node) {
    Write-Host 'Installez Node.js 24 puis lancez npm ci depuis le dossier du dépôt.'
    exit 1
}

& $node (Join-Path $PSScriptRoot '..\scripts\preparer-site.mjs') --local
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Préparation impossible. Exécutez npm ci depuis le dossier du dépôt.'
    exit $LASTEXITCODE
}

try {
    Remove-Item Env:ALBERT_API_KEY, Env:ALBERT_MODEL, Env:MICROALBERT_REAL_ACCESS_APPROVED -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $configPath) {
        try {
            $config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $secret = ConvertTo-SecureString $config.cle
            $env:ALBERT_API_KEY = Get-PlainText $secret
            $env:ALBERT_MODEL = $config.modele
            if ($config.quotaVerifie -eq $true) { $env:MICROALBERT_REAL_ACCESS_APPROVED = 'yes' }
        } catch {
            Remove-Item Env:ALBERT_API_KEY, Env:ALBERT_MODEL, Env:MICROALBERT_REAL_ACCESS_APPROVED -ErrorAction SilentlyContinue
            Write-Host 'Configuration Albert illisible. L''aide locale reste disponible.'
        }
    }
    & $node $server
    exit $LASTEXITCODE
} finally {
    Remove-Item Env:ALBERT_API_KEY, Env:ALBERT_MODEL, Env:MICROALBERT_REAL_ACCESS_APPROVED -ErrorAction SilentlyContinue
}
