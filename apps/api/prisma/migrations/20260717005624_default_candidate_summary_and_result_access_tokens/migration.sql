-- AlterEnum
ALTER TYPE "VerificationTokenPurpose" ADD VALUE 'CANDIDATE_RESULT_ACCESS';

-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "candidateResultVisibility" SET DEFAULT 'SUMMARY_ONLY';
