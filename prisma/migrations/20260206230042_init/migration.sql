-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "sharedItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SharedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "url" TEXT,
    "imagePath" TEXT,
    "title" TEXT,
    "firstSharedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSharedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shareCount" INTEGER NOT NULL DEFAULT 1,
    "referenceCount" INTEGER NOT NULL DEFAULT 0,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "embedding" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedItem_canonicalKey_key" ON "SharedItem"("canonicalKey");
