UPDATE "PsychometricScoreResult" AS psr
SET
  "overallIqScore" = COALESCE(psr."overallIqScore", psr."overallStandardScore"),
  "overallIqPercentile" = COALESCE(psr."overallIqPercentile", psr."overallPercentile"),
  "overallIqCi90Lower" = COALESCE(
    psr."overallIqCi90Lower",
    CASE
      WHEN psr."overallCi90Lower" IS NOT NULL
      THEN 100 + (psr."overallCi90Lower" * 15)
      ELSE NULL
    END
  ),
  "overallIqCi90Upper" = COALESCE(
    psr."overallIqCi90Upper",
    CASE
      WHEN psr."overallCi90Upper" IS NOT NULL
      THEN 100 + (psr."overallCi90Upper" * 15)
      ELSE NULL
    END
  ),
  "leaderboardEligible" = true,
  "leaderboardIneligibilityReasons" = '[]'::jsonb
FROM "Session" AS s
INNER JOIN "User" AS u ON u."id" = s."userId"
WHERE psr."sessionId" = s."id"
  AND u."role" = 'CONSUMER'
  AND COALESCE(psr."overallIqScore", psr."overallStandardScore") IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "PsychometricValidityFlag" AS vf
    WHERE vf."resultId" = psr."id"
      AND vf."severity" = 'HIGH'
  );
