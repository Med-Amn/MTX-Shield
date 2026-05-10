-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "hwid" TEXT,
    "ip" TEXT,
    "license" TEXT,
    "steamId" TEXT,
    "discordId" TEXT,
    "fivemId" TEXT,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serverId" TEXT NOT NULL,
    CONSTRAINT "Player_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LicenseKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "serverId" TEXT,
    "serverIp" TEXT,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "renewedAt" DATETIME,
    CONSTRAINT "LicenseKey_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KeyLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KeyLog_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "LicenseKey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BanProof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "banId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'URL',
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BanProof_banId_fkey" FOREIGN KEY ("banId") REFERENCES "BannedPlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan" TEXT NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "detail" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BannedPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "license" TEXT NOT NULL,
    "steamId" TEXT,
    "discordId" TEXT,
    "fivemId" TEXT,
    "playerId" TEXT,
    "playerName" TEXT,
    "hwid" TEXT,
    "ip" TEXT,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "bannedById" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "unbannedAt" DATETIME,
    CONSTRAINT "BannedPlayer_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BannedPlayer_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BannedPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BannedPlayer" ("bannedAt", "bannedById", "discordId", "evidence", "expiresAt", "fivemId", "id", "isActive", "license", "reason", "serverId", "steamId", "unbannedAt") SELECT "bannedAt", "bannedById", "discordId", "evidence", "expiresAt", "fivemId", "id", "isActive", "license", "reason", "serverId", "steamId", "unbannedAt" FROM "BannedPlayer";
DROP TABLE "BannedPlayer";
ALTER TABLE "new_BannedPlayer" RENAME TO "BannedPlayer";
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "plan", "serverId", "status", "stripeCustomerId", "stripeSubscriptionId") SELECT "createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "plan", "serverId", "status", "stripeCustomerId", "stripeSubscriptionId" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_serverId_key" ON "Subscription"("serverId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LicenseKey_key_key" ON "LicenseKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlan_plan_interval_key" ON "PricingPlan"("plan", "interval");
