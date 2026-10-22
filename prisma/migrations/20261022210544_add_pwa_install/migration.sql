-- CreateTable
CREATE TABLE "pwa_installs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pwa_installs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pwa_installs_createdAt_idx" ON "pwa_installs"("createdAt");
