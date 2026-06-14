-- CreateEnum
CREATE TYPE "AnalyticsExportRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'DECLINED', 'GENERATING', 'GENERATED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AnalyticsExportRequest" (
    "id" TEXT NOT NULL,
    "status" "AnalyticsExportRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "dataset" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "scope" JSONB,
    "requestedById" TEXT,
    "requestedRole" TEXT,
    "requestReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewDecision" TEXT,
    "reviewReason" TEXT,
    "generatedAt" TIMESTAMP(3),
    "fileKey" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsExportRequest_status_idx" ON "AnalyticsExportRequest"("status");

-- CreateIndex
CREATE INDEX "AnalyticsExportRequest_dataset_idx" ON "AnalyticsExportRequest"("dataset");

-- CreateIndex
CREATE INDEX "AnalyticsExportRequest_requestedById_idx" ON "AnalyticsExportRequest"("requestedById");

-- CreateIndex
CREATE INDEX "AnalyticsExportRequest_reviewedById_idx" ON "AnalyticsExportRequest"("reviewedById");

-- CreateIndex
CREATE INDEX "AnalyticsExportRequest_createdAt_idx" ON "AnalyticsExportRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "AnalyticsExportRequest" ADD CONSTRAINT "AnalyticsExportRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsExportRequest" ADD CONSTRAINT "AnalyticsExportRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
