--[[
    MTX SHIELD — FiveM AntiCheat Bridge
    Version: 2.0.0
    Description: Links your FiveM server to MTX SHIELD anti-cheat web panel.
    Installation: Place in resources/[mtx-shield]/fxmanifest.lua + this file
]]

local Config = {
    API_ENDPOINT = GetConvar("mtx_api_endpoint", "http://localhost:3000"),
    LICENSE_KEY  = GetConvar("mtx_license_key", ""),
    CHECK_INTERVAL = 300,       -- seconds between heartbeat
    HEARTBEAT_INTERVAL = 300,   -- seconds between heartbeat
    REQUEST_TIMEOUT = 5000,     -- ms timeout for HTTP requests
    VERBOSE = GetConvar("mtx_verbose", "false") == "true",
}

local function hmac_sign(payload, secret)
    -- Simple HMAC-SHA256 using FiveM's native crypto
    -- Note: requires server to have crypto library
    local hash = nil
    if Citizen.Await then
        -- FXServer 1.0+ with JS runtime
        hash = Citizen.Await(Citizen.invokeNativeGetEventContext and nil or nil)
    end
    -- Fallback: use os.time() based signing (simplified for Lua)
    -- In production, replace with proper HMAC via server-side JS bridge
    return nil
end

local function log(msg, level)
    level = level or "INFO"
    print(("[MTX-SHIELD] [%s] %s"):format(level, msg))
end

-----------------------------------------------------------------------
-- HTTP Request Helper
-----------------------------------------------------------------------
local function http_request(method, endpoint, body, license_key_override)
    local key = license_key_override or Config.LICENSE_KEY
    if key == "" then
        log("License key not configured. Set mtx_license_key convar.", "ERROR")
        return nil, "NO_LICENSE_KEY"
    end

    local url = Config.API_ENDPOINT .. endpoint
    local headers = {
        ["Content-Type"] = "application/json",
        ["X-API-Key"] = key,
    }

    -- Add HMAC signature
    local timestamp = tostring(os.time())
    local payload_str = ""
    if body then
        payload_str = json.encode(body) .. timestamp
    else
        payload_str = timestamp
    end
    headers["X-Timestamp"] = timestamp
    -- HMAC signing disabled in Lua fallback; server-side JS/TS handles real HMAC
    headers["X-Signature"] = "lua-bridge"

    local response_body = nil
    local success, result = pcall(function()
        return PerformHttpRequest(url, function(status, resp, headers)
            if status >= 200 and status < 300 then
                response_body = resp
            else
                response_body = nil
            end
        end, method, body and json.encode(body) or "", headers, false)
    end)

    if not success then
        log(("HTTP request failed: %s"):format(tostring(result)), "ERROR")
        return nil, "HTTP_ERROR"
    end

    -- Wait for async response
    local wait_start = os.time()
    while response_body == nil and (os.time() - wait_start) < 5 do
        Citizen.Wait(100)
    end

    if response_body == nil then
        log(("HTTP request timeout for %s %s"):format(method, endpoint), "ERROR")
        return nil, "TIMEOUT"
    end

    local ok, parsed = pcall(json.decode, response_body)
    if not ok then
        log(("Failed to parse response: %s"):format(tostring(parsed)), "ERROR")
        return nil, "PARSE_ERROR"
    end

    return parsed, nil
end

-----------------------------------------------------------------------
-- License Verification (called on server start)
-----------------------------------------------------------------------
local function verify_license()
    log("Verifying license key with MTX SHIELD...")

    local server_ip = GetConvar("sv_hostip", "0.0.0.0") or "0.0.0.0"
    local server_port = GetConvar("sv_hostport", "30120") or "30120"

    local result, err = http_request("POST", "/api/verify-license", {
        licenseKey = Config.LICENSE_KEY,
        serverIp = server_ip,
        timestamp = tostring(os.time()),
        signature = "lua-bridge",
    })

    if not result or not result.success then
        log(("License verification FAILED: %s"):format(err or "unknown"), "CRITICAL")
        log("Server will NOT start. Fix your license key in server.cfg", "CRITICAL")
        return false
    end

    local data = result.data
    if data.status == "valid" then
        log(("License VERIFIED | Plan: %s | Expires: %s"):format(data.plan or "N/A", data.expiresAt or "N/A"))
        return true
    elseif data.status == "expired" then
        log("License EXPIRED. Renew at " .. Config.API_ENDPOINT, "CRITICAL")
        return false
    else
        log(("License INVALID: %s"):format(data.message or "unknown"), "CRITICAL")
        return false
    end
end

-----------------------------------------------------------------------
-- Player Check (called when player connects)
-----------------------------------------------------------------------
local function check_player(source, identifiers)
    local hwid = identifiers.hwid or identifiers.license or "unknown"
    local player_name = GetPlayerName(source) or "unknown"
    local player_ip = identifiers.ip or "0.0.0.0"
    local license_id = identifiers.license or ""

    local result, err = http_request("POST", "/api/check-player", {
        licenseKey = Config.LICENSE_KEY,
        hwid = hwid,
        ip = player_ip,
        playerName = player_name,
        license = license_id,
        timestamp = tostring(os.time()),
        signature = "lua-bridge",
    })

    if not result or not result.success then
        log(("Player check failed for %s (%s): %s"):format(player_name, hwid, err or "unknown"), "WARN")
        -- On error, allow player to join (fail open)
        return true, nil
    end

    if result.data.status == "banned" then
        log(("BLOCKED banned player: %s (%s) - Reason: %s"):format(player_name, hwid, result.data.reason or "N/A"))
        return false, result.data.reason or "You are banned from this server."
    end

    if result.data.status == "license_expired" then
        log("License expired during player check!", "CRITICAL")
        return false, "Server license expired. Contact administrator."
    end

    return true, nil
end

-----------------------------------------------------------------------
-- Auto Ban Report (called when cheat detected)
-----------------------------------------------------------------------
local function report_ban(player_source, reason, detection_type)
    local player_name = GetPlayerName(player_source) or "unknown"
    local identifiers = ExtractIdentifiers(player_source)
    local hwid = identifiers.hwid or identifiers.license or "unknown"
    local player_ip = identifiers.ip or "0.0.0.0"
    local license_id = identifiers.license or ""

    local result, err = http_request("POST", "/api/report-ban", {
        licenseKey = Config.LICENSE_KEY,
        playerName = player_name,
        hwid = hwid,
        playerIp = player_ip,
        license = license_id,
        reason = reason,
        detectionType = detection_type or "AUTO_DETECT",
        timestamp = tostring(os.time()),
        signature = "lua-bridge",
    })

    if result and result.success then
        log(("Auto-ban reported: %s (%s) - Status: %s"):format(player_name, hwid, result.data.status or "confirmed"))

        if result.data.status == "confirmed" then
            DropPlayer(player_source, "Banned: " .. reason)
        end
    else
        log(("Failed to report ban for %s: %s"):format(player_name, err or "unknown"), "ERROR")
        -- Still drop player locally even if API fails
        DropPlayer(player_source, "Kicked: " .. reason)
    end
end

-----------------------------------------------------------------------
-- Heartbeat (runs every 5 minutes)
-----------------------------------------------------------------------
local function send_heartbeat()
    local player_count = #GetPlayers()
    local server_ip = GetConvar("sv_hostip", "0.0.0.0") or "0.0.0.0"

    local result, err = http_request("POST", "/api/fivem/heartbeat", {
        licenseKey = Config.LICENSE_KEY,
        playerCount = player_count,
        serverIp = server_ip,
        timestamp = tostring(os.time()),
        signature = "lua-bridge",
    })

    if result and result.success then
        if Config.VERBOSE then
            log(("Heartbeat OK | Players: %d"):format(player_count))
        end
    else
        log(("Heartbeat failed: %s"):format(err or "unknown"), "WARN")
    end
end

-----------------------------------------------------------------------
-- Identifier Extraction
-----------------------------------------------------------------------
function ExtractIdentifiers(source)
    local ids = {}
    for _, id in ipairs(GetPlayerIdentifiers(source)) do
        if id:find("license2:") then
            ids.license = id:gsub("license2:", "")
        elseif id:find("license:") then
            ids.license = ids.license or id:gsub("license:", "")
        elseif id:find("steam:") then
            ids.steam = id:gsub("steam:", "")
        elseif id:find("discord:") then
            ids.discord = id:gsub("discord:", "")
        elseif id:find("fivem:") then
            ids.fivem = id:gsub("fivem:", "")
        elseif id:find("ip:") then
            ids.ip = id:gsub("ip:", "")
        elseif id:find("hwid:") then
            ids.hwid = id:gsub("hwid:", "")
        end
    end
    -- Fallback HWID
    if not ids.hwid then
        ids.hwid = ids.license or ("unknown-" .. tostring(source))
    end
    return ids
end

-----------------------------------------------------------------------
-- Event Handlers
-----------------------------------------------------------------------

-- On player connecting, check against MTX SHIELD
AddEventHandler("playerConnecting", function(playerName, setKickReason, deferrals)
    local source = source
    deferrals.defer()

    Citizen.Wait(500) -- Small delay for identifiers to load

    local identifiers = ExtractIdentifiers(source)
    local hwid = identifiers.hwid or identifiers.license or "unknown"

    deferrals.update("Checking anti-cheat status...")

    local allowed, reason = check_player(source, identifiers)

    if not allowed then
        deferrals.done(reason or "Connection rejected by anti-cheat system.")
        log(("Player %s (%s) rejected: %s"):format(playerName, hwid, reason or "banned"))
    else
        deferrals.done()
        if Config.VERBOSE then
            log(("Player %s (%s) allowed"):format(playerName, hwid))
        end
    end
end)

-- On player drop, log it
AddEventHandler("playerDropped", function(reason)
    local source = source
    local playerName = GetPlayerName(source) or "unknown"
    if Config.VERBOSE then
        log(("Player dropped: %s (%s)"):format(playerName, reason or "unknown"))
    end
end)

-----------------------------------------------------------------------
-- Exported Functions for Other Resources
-----------------------------------------------------------------------

-- Other resources can call this to report a cheat detection
-- Usage: exports.mtx_shield:reportBan(source, "Speed hacking", "SPEED_HACK")
exports("reportBan", function(playerSource, reason, detectionType)
    report_ban(playerSource, reason, detectionType)
end)

-- Check if a specific player is banned
-- Usage: exports.mtx_shield:isPlayerBanned(source, callback)
exports("isPlayerBanned", function(playerSource, callback)
    local identifiers = ExtractIdentifiers(playerSource)
    local hwid = identifiers.hwid or identifiers.license or "unknown"

    local result, err = http_request("POST", "/api/check-player", {
        licenseKey = Config.LICENSE_KEY,
        hwid = hwid,
        ip = identifiers.ip or "0.0.0.0",
        playerName = GetPlayerName(playerSource) or "unknown",
        license = identifiers.license or "",
        timestamp = tostring(os.time()),
        signature = "lua-bridge",
    })

    if result and result.success then
        callback(result.data.status == "banned", result.data)
    else
        callback(false, { error = err })
    end
end)

-----------------------------------------------------------------------
-- Main Loop
-----------------------------------------------------------------------
Citizen.CreateThread(function()
    -- Wait for server to be ready
    Citizen.Wait(5000)

    -- Verify license on startup
    local license_valid = verify_license()
    if not license_valid then
        -- Shutdown resources or warn
        log("Server running with INVALID license. Stopping bridge.", "CRITICAL")

        -- Prevent any player from joining
        AddEventHandler("playerConnecting", function(_, setKickReason)
            setKickReason("Server anti-cheat license is invalid or expired. Contact server owner.")
            CancelEvent()
        end)
        return
    end

    log("MTX SHIELD Bridge ACTIVE | Endpoint: " .. Config.API_ENDPOINT)

    -- Heartbeat loop
    Citizen.CreateThread(function()
        while true do
            Citizen.Wait(Config.HEARTBEAT_INTERVAL * 1000)
            send_heartbeat()
        end
    end)
end)

-----------------------------------------------------------------------
-- Console Commands
-----------------------------------------------------------------------
RegisterCommand("mtx_status", function()
    log("=== MTX SHIELD Status ===")
    log(("Endpoint: %s"):format(Config.API_ENDPOINT))
    log(("License: %s..."):format(Config.LICENSE_KEY:sub(1, 16)))
    log(("Verbose: %s"):format(tostring(Config.VERBOSE)))
    log(("Players: %d"):format(#GetPlayers()))
end, false)

log("MTX SHIELD Bridge loaded. Version 2.0.0")
