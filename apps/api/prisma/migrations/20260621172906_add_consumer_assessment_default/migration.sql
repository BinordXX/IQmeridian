-- CreateTable
CREATE TABLE "ConsumerAssessmentDefault" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "assessmentFormId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumerAssessmentDefault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsumerAssessmentDefault_key_key" ON "ConsumerAssessmentDefault"("key");

-- CreateIndex
CREATE INDEX "ConsumerAssessmentDefault_assessmentFormId_idx" ON "ConsumerAssessmentDefault"("assessmentFormId");

-- AddForeignKey
ALTER TABLE "ConsumerAssessmentDefault" ADD CONSTRAINT "ConsumerAssessmentDefault_assessmentFormId_fkey" FOREIGN KEY ("assessmentFormId") REFERENCES "AssessmentForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
