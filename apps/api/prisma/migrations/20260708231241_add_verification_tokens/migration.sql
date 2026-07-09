-- CreateEnum
CREATE TYPE "VerificationTokenPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'ORGANISATION_ADMIN_INVITATION', 'CANDIDATE_INVITATION_NOTIFICATION');

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "purpose" "VerificationTokenPurpose" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenLastFour" TEXT,
    "email" TEXT NOT NULL,
    "subjectUserId" TEXT,
    "organisationAdminInvitationId" TEXT,
    "candidateInvitationId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_purpose_idx" ON "VerificationToken"("purpose");

-- CreateIndex
CREATE INDEX "VerificationToken_email_idx" ON "VerificationToken"("email");

-- CreateIndex
CREATE INDEX "VerificationToken_subjectUserId_idx" ON "VerificationToken"("subjectUserId");

-- CreateIndex
CREATE INDEX "VerificationToken_organisationAdminInvitationId_idx" ON "VerificationToken"("organisationAdminInvitationId");

-- CreateIndex
CREATE INDEX "VerificationToken_candidateInvitationId_idx" ON "VerificationToken"("candidateInvitationId");

-- CreateIndex
CREATE INDEX "VerificationToken_expiresAt_idx" ON "VerificationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "VerificationToken_usedAt_idx" ON "VerificationToken"("usedAt");

-- CreateIndex
CREATE INDEX "VerificationToken_revokedAt_idx" ON "VerificationToken"("revokedAt");

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_organisationAdminInvitationId_fkey" FOREIGN KEY ("organisationAdminInvitationId") REFERENCES "OrganisationAdminInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_candidateInvitationId_fkey" FOREIGN KEY ("candidateInvitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
