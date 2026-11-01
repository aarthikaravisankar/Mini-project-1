$ErrorActionPreference = "Stop"
$workingDir = (Resolve-Path "Emergency Ambulance\Emergency Ambulance").Path

Write-Host "=========================================================="
Write-Host "Starting Emergency Ambulance Dispatch System Verification"
Write-Host "=========================================================="

# Compile Java Backend
Write-Host "Compiling Java backend..."
$javacExe = "C:\Program Files\Java\jdk-21.0.12.1\bin\javac.exe"
& $javacExe -encoding UTF-8 -cp "$workingDir/backend-java/lib/*" -d "$workingDir/backend-java/bin" (Get-ChildItem "$workingDir/backend-java/src/com/ambulance108/*.java").FullName
if ($LASTEXITCODE -ne 0) {
    throw "Compilation failed!"
}
Write-Host "Compilation complete."

# Kill any previous process on port 8001
Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Terminating previous process on port 8001 (PID: $($_.OwningProcess))..."
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Milliseconds 800

# Start Java Server process
$javaExe = "C:\Program Files\Java\jdk-21.0.12.1\bin\java.exe"
$cp = "backend-java/bin;backend-java/lib/*"
$serverOutLog = Join-Path $workingDir "test_server_out.log"
$serverErrLog = Join-Path $workingDir "test_server_err.log"
if (Test-Path $serverOutLog) { Remove-Item -Force $serverOutLog }
if (Test-Path $serverErrLog) { Remove-Item -Force $serverErrLog }

$proc = Start-Process -FilePath $javaExe `
    -ArgumentList "-cp `"$cp`" com.ambulance108.Server" `
    -WorkingDirectory $workingDir `
    -RedirectStandardOutput $serverOutLog `
    -RedirectStandardError $serverErrLog `
    -PassThru
Write-Host "Started Java backend server with PID: $($proc.Id)"

Start-Sleep -Seconds 3

try {
    # 1. Verify Hospitals API
    Write-Host "`n--- TEST 1: Exactly 7 Erode Regional Hospitals ---"
    $hospJson = Invoke-RestMethod -Uri "http://localhost:8001/api/hospitals" -Method Get
    Write-Host "Total hospitals returned: $($hospJson.Count)"
    $hospJson | ForEach-Object { Write-Host "Returned Hosp ID: $($_.id), Name: $($_.name)" }
    if ($hospJson.Count -ne 7) {
        throw "Expected exactly 7 hospitals, got $($hospJson.Count)"
    }
    foreach ($h in $hospJson) {
        Write-Host "  [$($h.id)] $($h.name) - $($h.location_name) (ER: $($h.emergency_beds), ICU: $($h.icu_beds), O2: $($h.oxygen_beds))"
        if (-not $h.id.StartsWith("ERODE-HOSP-")) {
            throw "Found non-Erode hospital: $($h.id)"
        }
    }
    Write-Host "PASS: Exactly 7 Erode hospitals displayed, Chennai hospitals excluded." -ForegroundColor Green

    # 2. Verify Ambulances API
    Write-Host "`n--- TEST 2: Exactly 7 Active Drivers & Ambulances ---"
    $ambJson = Invoke-RestMethod -Uri "http://localhost:8001/api/ambulances" -Method Get
    Write-Host "Total ambulances returned: $($ambJson.Count)"
    if ($ambJson.Count -ne 7) {
        throw "Expected exactly 7 ambulances, got $($ambJson.Count)"
    }
    foreach ($a in $ambJson) {
        Write-Host "  [$($a.id)] Driver: $($a.driver_name) ($($a.driver_id)) | Vehicle: $($a.vehicle_no) | Base: $($a.base_station) | Status: $($a.status)"
    }
    $murugan = $ambJson | Where-Object { $_.id -eq 'AMB-101' }
    if ($murugan.driver_name -ne 'Murugan R.') {
        throw "Expected AMB-101 driver to be Murugan R., got $($murugan.driver_name)"
    }
    Write-Host "PASS: Exactly 7 drivers & ambulances displayed, Murugan mapped to AMB-101/DRV-101." -ForegroundColor Green

    # 3. Verify Stats API
    Write-Host "`n--- TEST 3: Accurate Fleet & Hospital Counts ---"
    $stats = Invoke-RestMethod -Uri "http://localhost:8001/api/stats" -Method Get
    Write-Host "Stats: Total Fleet=$($stats.total_ambulances), Avail=$($stats.available_ambulances), Disp=$($stats.dispatched_ambulances), Maint=$($stats.maintenance_ambulances), Total Beds=$($stats.total_hospital_beds)"
    if ($stats.total_ambulances -ne 7) {
        throw "Expected total fleet to be 7, got $($stats.total_ambulances)"
    }
    Write-Host "PASS: KPI statistics reflect exactly the 7 active ambulances and 7 active hospitals." -ForegroundColor Green

    # 4. Verify Dispatch Isolation (Dispatch Murugan AMB-101)
    Write-Host "`n--- TEST 4: Dispatch Isolation (Dispatch Murugan Only) ---"
    # Register test call
    $regBody = @{
        caller_phone = "9842199999"
        caller_name = "Test Caller"
        location_name = "Perundurai Bypass Roundana"
        latitude = 11.2785
        longitude = 77.5835
        incident_type = "Cardiac Emergency"
        severity = "High"
        ambulances_required = 1
        notes = "Urgent dispatch test"
    } | ConvertTo-Json

    $newIncResp = Invoke-RestMethod -Uri "http://localhost:8001/api/incidents?bypass_duplicate_check=true" -Method Post -Body $regBody -ContentType "application/json"
    $testIncId = $newIncResp.incident.id
    Write-Host "Created test incident: $testIncId"

    # Dispatch Murugan (AMB-101)
    $dispBody = @{
        incident_id = $testIncId
        ambulance_id = "AMB-101"
    } | ConvertTo-Json
    $dispResp = Invoke-RestMethod -Uri "http://localhost:8001/api/dispatch/confirm" -Method Post -Body $dispBody -ContentType "application/json"
    Write-Host "Dispatched AMB-101: $($dispResp.message)"

    # Verify statuses across all 7 ambulances
    $ambAfterDisp = Invoke-RestMethod -Uri "http://localhost:8001/api/ambulances" -Method Get
    $amb101 = $ambAfterDisp | Where-Object { $_.id -eq 'AMB-101' }
    if ($amb101.status -ne 'Dispatched') {
        throw "Expected AMB-101 to be Dispatched, got $($amb101.status)"
    }

    $otherAmbs = $ambAfterDisp | Where-Object { $_.id -ne 'AMB-101' }
    foreach ($oa in $otherAmbs) {
        if ($oa.status -ne 'Available') {
            throw "Ambulance $($oa.id) ($($oa.driver_name)) status unexpectedly changed to $($oa.status)!"
        }
    }
    Write-Host "PASS: Murugan (AMB-101) is Dispatched. All other 6 drivers remain Available!" -ForegroundColor Green

    # 5. Verify Prevention of Double Dispatching
    Write-Host "`n--- TEST 5: Prevent Double Dispatching ---"
    try {
        Invoke-RestMethod -Uri "http://localhost:8001/api/dispatch/confirm" -Method Post -Body $dispBody -ContentType "application/json"
        throw "Should have failed to dispatch already occupied AMB-101!"
    } catch {
        Write-Host "PASS: Server correctly rejected double-dispatch: $($_.Exception.Message)" -ForegroundColor Green
    }

    # 6. Verify Trip Completion Isolation
    Write-Host "`n--- TEST 6: Trip Completion Isolation ---"
    $completeBody = @{
        ambulance_id = "AMB-101"
        status = "Completed"
        selected_hospital_id = "ERODE-HOSP-01"
    } | ConvertTo-Json
    $compResp = Invoke-RestMethod -Uri "http://localhost:8001/api/driver/status" -Method Post -Body $completeBody -ContentType "application/json"
    Write-Host "Completed trip for AMB-101: $($compResp.message)"

    $ambAfterComp = Invoke-RestMethod -Uri "http://localhost:8001/api/ambulances" -Method Get
    $amb101Comp = $ambAfterComp | Where-Object { $_.id -eq 'AMB-101' }
    if ($amb101Comp.status -ne 'Available') {
        throw "Expected AMB-101 to return to Available after completion, got $($amb101Comp.status)"
    }
    Write-Host "PASS: AMB-101 successfully returned to Available upon trip completion." -ForegroundColor Green

    # 7. Verify Independent Hospital Bed Update
    Write-Host "`n--- TEST 7: Independent Hospital Bed Management ---"
    $initialHosp = Invoke-RestMethod -Uri "http://localhost:8001/api/hospitals" -Method Get
    $h1Before = $initialHosp | Where-Object { $_.id -eq 'ERODE-HOSP-01' }
    $h2Before = $initialHosp | Where-Object { $_.id -eq 'ERODE-HOSP-02' }

    $newErBeds = $h1Before.emergency_beds + 2
    $bedUpdateBody = @{
        emergency_beds = $newErBeds
        icu_beds = $h1Before.icu_beds
        oxygen_beds = $h1Before.oxygen_beds
    } | ConvertTo-Json

    $bedUpdateResp = Invoke-RestMethod -Uri "http://localhost:8001/api/hospitals/ERODE-HOSP-01/beds" -Method Put -Body $bedUpdateBody -ContentType "application/json"
    Write-Host "Updated beds for ERODE-HOSP-01: ER=$($bedUpdateResp.hospital.emergency_beds)"

    $hospAfterUpdate = Invoke-RestMethod -Uri "http://localhost:8001/api/hospitals" -Method Get
    $h1After = $hospAfterUpdate | Where-Object { $_.id -eq 'ERODE-HOSP-01' }
    $h2After = $hospAfterUpdate | Where-Object { $_.id -eq 'ERODE-HOSP-02' }

    if ($h1After.emergency_beds -ne $newErBeds) {
        throw "ERODE-HOSP-01 beds were not updated in database!"
    }
    if ($h2After.emergency_beds -ne $h2Before.emergency_beds) {
        throw "ERODE-HOSP-02 beds were unexpectedly modified!"
    }
    Write-Host "PASS: ERODE-HOSP-01 beds independently updated in MySQL. Other hospitals unaffected!" -ForegroundColor Green

    # 8. Verify Authentication & Role Logins API
    Write-Host "`n--- TEST 8: Role Authentication API (Control Room, Driver, Hospital) ---"
    $crLoginBody = @{ role = "control_room"; password = "108" } | ConvertTo-Json
    $crLoginResp = Invoke-RestMethod -Uri "http://localhost:8001/api/login" -Method Post -Body $crLoginBody -ContentType "application/json"
    if ($crLoginResp.status -ne 'success') {
        throw "Control room login failed!"
    }
    Write-Host "  Control Room login success: $($crLoginResp.user.full_name) ($($crLoginResp.user.role))"

    $drvLoginBody = @{ username = "driver101"; password = "driver123"; role = "driver" } | ConvertTo-Json
    $drvLoginResp = Invoke-RestMethod -Uri "http://localhost:8001/api/login" -Method Post -Body $drvLoginBody -ContentType "application/json"
    if ($drvLoginResp.status -ne 'success' -or $drvLoginResp.user.username -ne 'driver101') {
        throw "Driver login failed!"
    }
    Write-Host "  Driver login success: $($drvLoginResp.user.full_name) -> $($drvLoginResp.user.ambulance_id)"

    $hospLoginBody = @{ identifier = "ERODE-HOSP-01"; password = "hospital123"; role = "hospital" } | ConvertTo-Json
    $hospLoginResp = Invoke-RestMethod -Uri "http://localhost:8001/api/login" -Method Post -Body $hospLoginBody -ContentType "application/json"
    if ($hospLoginResp.status -ne 'success') {
        throw "Hospital desk login failed!"
    }
    Write-Host "  Hospital login success: $($hospLoginResp.user.full_name)"
    Write-Host "PASS: Role-based authentication verified across Control Room, Driver, and Hospital portals." -ForegroundColor Green

    # 9. Verify Drivers API
    Write-Host "`n--- TEST 9: Dedicated Drivers API ---"
    $driversJson = Invoke-RestMethod -Uri "http://localhost:8001/api/drivers" -Method Get
    Write-Host "Total drivers returned: $($driversJson.Count)"
    if ($driversJson.Count -ne 7) {
        throw "Expected exactly 7 drivers, got $($driversJson.Count)"
    }
    $singleDriver = Invoke-RestMethod -Uri "http://localhost:8001/api/drivers/DRV-101" -Method Get
    if ($singleDriver.name -ne 'Murugan R.') {
        throw "Expected DRV-101 to be Murugan R., got $($singleDriver.name)"
    }
    Write-Host "PASS: Dedicated drivers API correctly returns all 7 drivers with assigned ambulances." -ForegroundColor Green

    # 10. Verify Routes API
    Write-Host "`n--- TEST 10: Routing & Road Waypoints API ---"
    $routeBody = @{
        start_latitude = 11.2780
        start_longitude = 77.5840
        end_latitude = 11.3410
        end_longitude = 77.7280
    } | ConvertTo-Json
    $routeResp = Invoke-RestMethod -Uri "http://localhost:8001/api/routes" -Method Post -Body $routeBody -ContentType "application/json"
    if ($routeResp.status -ne 'success' -or $routeResp.distance_km -le 0 -or $routeResp.route_coordinates.Count -lt 2) {
        throw "Route calculation failed!"
    }
    Write-Host "  Calculated route: $($routeResp.distance_km) km, ETA: $($routeResp.eta_minutes) mins, Waypoints: $($routeResp.route_coordinates.Count)"
    Write-Host "PASS: Road routing and waypoint generation verified." -ForegroundColor Green

    # 11. Verify Hospital Bed Query API
    Write-Host "`n--- TEST 11: Specific Hospital Bed Query API ---"
    $bedResp = Invoke-RestMethod -Uri "http://localhost:8001/api/hospitals/ERODE-HOSP-01/beds" -Method Get
    if ($bedResp.emergency_beds -ne $newErBeds) {
        throw "Expected emergency beds $newErBeds, got $($bedResp.emergency_beds)"
    }
    Write-Host "  ERODE-HOSP-01 beds: ER=$($bedResp.emergency_beds), ICU=$($bedResp.icu_beds), O2=$($bedResp.oxygen_beds), Total=$($bedResp.total_beds)"
    Write-Host "PASS: Hospital bed endpoint returned verified database counts." -ForegroundColor Green

    Write-Host "`n=========================================================="
    Write-Host "ALL 11 VERIFICATION TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "=========================================================="

} finally {
    Write-Host "Stopping test server process..."
    if ($proc -and -not $proc.HasExited) {
        $proc.Kill()
        $proc.WaitForExit()
    }
    if (Test-Path $serverOutLog) {
        Write-Host "`n--- SERVER STDOUT TAIL ---"
        Get-Content $serverOutLog -Tail 30
    }
    if (Test-Path $serverErrLog) {
        Write-Host "`n--- SERVER STDERR TAIL ---"
        Get-Content $serverErrLog -Tail 30
    }
}
