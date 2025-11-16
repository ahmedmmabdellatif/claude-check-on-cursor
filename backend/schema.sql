
CREATE TABLE IF NOT EXISTS "ParsedPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sourceFilename" TEXT NOT NULL,
    "pagesCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaCoachName" TEXT,
    "metaDurationWeeks" INTEGER,
    "rawJson" TEXT NOT NULL,
    "debugJson" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "ParsedPlan_createdAt_idx" ON "ParsedPlan"("createdAt");
CREATE INDEX IF NOT EXISTS "ParsedPlan_status_idx" ON "ParsedPlan"("status");

CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planId" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "type" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "resolvedUrl" TEXT,
    "thumbnailUrl" TEXT,
    "exerciseName" TEXT,
    "notes" TEXT,
    CONSTRAINT "MediaAsset_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ParsedPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MediaAsset_planId_idx" ON "MediaAsset"("planId");
CREATE INDEX IF NOT EXISTS "MediaAsset_type_idx" ON "MediaAsset"("type");
