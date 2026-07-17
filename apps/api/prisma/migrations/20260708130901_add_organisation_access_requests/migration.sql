-- CreateEnum
CREATE TYPE "OrganisationAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CONVERTED');

-- CreateTable
CREATE TABLE "OrganisationAccessRequest" (
    "id" TEXT NOT NULL,
    "organisationName" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "intendedUse" TEXT NOT NULL,
    "expectedVolume" TEXT,
    "status" "OrganisationAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "convertedOrganisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganisationAccessRequest_status_idx" ON "OrganisationAccessRequest"("status");

-- CreateIndex
CREATE INDEX "OrganisationAccessRequest_contactEmail_idx" ON "OrganisationAccessRequest"("contactEmail");

-- CreateIndex
CREATE INDEX "OrganisationAccessRequest_createdAt_idx" ON "OrganisationAccessRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "OrganisationAccessRequest" ADD CONSTRAINT "OrganisationAccessRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
