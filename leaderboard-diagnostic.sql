SELECT
  psr."id",
  u."email",
  u."name",
  u."leaderboardOptIn",
  psr."overallIqScore",
  psr."overallStandardScore",
  psr."leaderboardEligible",
  psr."leaderboardIneligibilityReasons",
  psr."overallScoreBand",
  psr."generatedAt",
  COUNT(vf."id") FILTER (WHERE vf."severity" = 'HIGH') AS "highFlagCount",
  COUNT(vf."id") AS "flagCount"
FROM "PsychometricScoreResult" psr
INNER JOIN "Session" s ON s."id" = psr."sessionId"
INNER JOIN "User" u ON u."id" = s."userId"
LEFT JOIN "PsychometricValidityFlag" vf ON vf."resultId" = psr."id"
WHERE u."role" = 'CONSUMER'
GROUP BY psr."id", u."email", u."name", u."leaderboardOptIn"
ORDER BY psr."generatedAt" DESC;
