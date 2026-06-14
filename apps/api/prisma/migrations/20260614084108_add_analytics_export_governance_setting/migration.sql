-- CreateTable
CREATE TABLE "AnalyticsExportGovernanceSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "updatedByRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsExportGovernanceSetting_pkey" PRIMARY KEY ("id")
);
