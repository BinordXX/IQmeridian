-- CreateEnum
CREATE TYPE "OrganisationAdminInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "OrganisationAdminInvitation" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "organisationAccessRequestId" TEXT,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYER_ADMIN',
    "status" "OrganisationAdminInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT,
    "acceptedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationAdminInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationAdminInvitation_organisationAccessRequestId_key" ON "OrganisationAdminInvitation"("organisationAccessRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationAdminInvitation_token_key" ON "OrganisationAdminInvitation"("token");

-- CreateIndex
CREATE INDEX "OrganisationAdminInvitation_organisationId_idx" ON "OrganisationAdminInvitation"("organisationId");

-- CreateIndex
CREATE INDEX "OrganisationAdminInvitation_organisationAccessRequestId_idx" ON "OrganisationAdminInvitation"("organisationAccessRequestId");

-- CreateIndex
CREATE INDEX "OrganisationAdminInvitation_email_idx" ON "OrganisationAdminInvitation"("email");

-- CreateIndex
CREATE INDEX "OrganisationAdminInvitation_token_idx" ON "OrganisationAdminInvitation"("token");

-- CreateIndex
CREATE INDEX "OrganisationAdminInvitation_status_idx" ON "OrganisationAdminInvitation"("status");

-- CreateIndex
CREATE INDEX "OrganisationAdminInvitation_invitedById_idx" ON "OrganisationAdminInvitation"("invitedById");

-- CreateIndex
CREATE INDEX "OrganisationAdminInvitation_acceptedById_idx" ON "OrganisationAdminInvitation"("acceptedById");

-- CreateIndex
CREATE INDEX "OrganisationAdminInvitation_expiresAt_idx" ON "OrganisationAdminInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "OrganisationAdminInvitation" ADD CONSTRAINT "OrganisationAdminInvitation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationAdminInvitation" ADD CONSTRAINT "OrganisationAdminInvitation_organisationAccessRequestId_fkey" FOREIGN KEY ("organisationAccessRequestId") REFERENCES "OrganisationAccessRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationAdminInvitation" ADD CONSTRAINT "OrganisationAdminInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationAdminInvitation" ADD CONSTRAINT "OrganisationAdminInvitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
