import 'dotenv/config';
import {
  AssessmentDomain,
  AssessmentSectionType,
  CampaignStatus,
  FormItemMappingStatus,
  InvitationStatus,
  ItemStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const platformAdmin = await prisma.user.upsert({
    where: { id: 'dev-platform-admin' },
    update: {
      email: 'platform.admin@iqmeridian.dev',
      name: 'Dev Platform Admin',
      role: UserRole.PLATFORM_ADMIN,
    },
    create: {
      id: 'dev-platform-admin',
      email: 'platform.admin@iqmeridian.dev',
      name: 'Dev Platform Admin',
      role: UserRole.PLATFORM_ADMIN,
    },
  });

  const organisation = await prisma.organisation.upsert({
    where: { id: 'dev-employer-org' },
    update: {
      name: 'IQMeridian Demo Employer',
    },
    create: {
      id: 'dev-employer-org',
      name: 'IQMeridian Demo Employer',
    },
  });

  const employerAdmin = await prisma.user.upsert({
    where: { id: 'dev-employer-admin' },
    update: {
      email: 'employer.admin@iqmeridian.dev',
      name: 'Dev Employer Admin',
      role: UserRole.EMPLOYER_ADMIN,
      organisationId: organisation.id,
    },
    create: {
      id: 'dev-employer-admin',
      email: 'employer.admin@iqmeridian.dev',
      name: 'Dev Employer Admin',
      role: UserRole.EMPLOYER_ADMIN,
      organisationId: organisation.id,
    },
  });

  const candidateUser = await prisma.user.upsert({
    where: { id: 'dev-candidate-1' },
    update: {
      email: 'candidate.one@iqmeridian.dev',
      name: 'Dev Candidate One',
      role: UserRole.CANDIDATE,
      organisationId: null,
    },
    create: {
      id: 'dev-candidate-1',
      email: 'candidate.one@iqmeridian.dev',
      name: 'Dev Candidate One',
      role: UserRole.CANDIDATE,
      organisationId: null,
    },
  });

  const consumerUser = await prisma.user.upsert({
    where: { id: 'dev-consumer-1' },
    update: {
      email: 'consumer.one@iqmeridian.dev',
      name: 'Dev Consumer One',
      role: UserRole.CONSUMER,
      organisationId: null,
    },
    create: {
      id: 'dev-consumer-1',
      email: 'consumer.one@iqmeridian.dev',
      name: 'Dev Consumer One',
      role: UserRole.CONSUMER,
      organisationId: null,
    },
  });

  const form = await prisma.assessmentForm.upsert({
    where: { id: 'dev-form-mvp-1' },
    update: {
      name: 'IQMeridian MVP Cognitive Assessment',
      version: 1,
      isActive: true,
    },
    create: {
      id: 'dev-form-mvp-1',
      name: 'IQMeridian MVP Cognitive Assessment',
      version: 1,
      isActive: true,
    },
  });

  const abstractSection = await prisma.assessmentSection.upsert({
    where: { id: 'dev-section-abstract-1' },
    update: {
      formId: form.id,
      type: AssessmentSectionType.ABSTRACT,
      domain: AssessmentDomain.ABSTRACT_REASONING,
      title: 'Abstract Reasoning',
      timeLimitSec: 600,
      orderIndex: 1,
    },
    create: {
      id: 'dev-section-abstract-1',
      formId: form.id,
      type: AssessmentSectionType.ABSTRACT,
      domain: AssessmentDomain.ABSTRACT_REASONING,
      title: 'Abstract Reasoning',
      timeLimitSec: 600,
      orderIndex: 1,
    },
  });

  const numericalSection = await prisma.assessmentSection.upsert({
    where: { id: 'dev-section-numerical-1' },
    update: {
      formId: form.id,
      type: AssessmentSectionType.NUMERICAL,
      domain: AssessmentDomain.NUMERICAL_REASONING,
      title: 'Numerical Reasoning',
      timeLimitSec: 600,
      orderIndex: 2,
    },
    create: {
      id: 'dev-section-numerical-1',
      formId: form.id,
      type: AssessmentSectionType.NUMERICAL,
      domain: AssessmentDomain.NUMERICAL_REASONING,
      title: 'Numerical Reasoning',
      timeLimitSec: 600,
      orderIndex: 2,
    },
  });

  const abstractItem = await prisma.item.upsert({
    where: { id: 'dev-item-abstract-1' },
    update: {
      domain: AssessmentDomain.ABSTRACT_REASONING,
      prompt:
        'Which option best completes the pattern: circle, triangle, circle, triangle, ?',
      itemType: 'MULTIPLE_CHOICE',
      options: ['circle', 'triangle', 'square', 'hexagon'],
      correctAnswer: 'circle',
      difficulty: 'EASY',
      status: ItemStatus.ACTIVE,
    },
    create: {
      id: 'dev-item-abstract-1',
      domain: AssessmentDomain.ABSTRACT_REASONING,
      prompt:
        'Which option best completes the pattern: circle, triangle, circle, triangle, ?',
      itemType: 'MULTIPLE_CHOICE',
      options: ['circle', 'triangle', 'square', 'hexagon'],
      correctAnswer: 'circle',
      difficulty: 'EASY',
      status: ItemStatus.ACTIVE,
    },
  });

  const numericalItem = await prisma.item.upsert({
    where: { id: 'dev-item-numerical-1' },
    update: {
      domain: AssessmentDomain.NUMERICAL_REASONING,
      prompt:
        'If 12 workers complete a task in 6 days, how many days would 18 workers take at the same rate?',
      itemType: 'MULTIPLE_CHOICE',
      options: ['3', '4', '6', '9'],
      correctAnswer: '4',
      difficulty: 'MEDIUM',
      status: ItemStatus.ACTIVE,
    },
    create: {
      id: 'dev-item-numerical-1',
      domain: AssessmentDomain.NUMERICAL_REASONING,
      prompt:
        'If 12 workers complete a task in 6 days, how many days would 18 workers take at the same rate?',
      itemType: 'MULTIPLE_CHOICE',
      options: ['3', '4', '6', '9'],
      correctAnswer: '4',
      difficulty: 'MEDIUM',
      status: ItemStatus.ACTIVE,
    },
  });

  await prisma.formItemMapping.upsert({
    where: { id: 'dev-mapping-abstract-1' },
    update: {
      formId: form.id,
      sectionId: abstractSection.id,
      itemId: abstractItem.id,
      orderIndex: 1,
      status: FormItemMappingStatus.ACTIVE,
    },
    create: {
      id: 'dev-mapping-abstract-1',
      formId: form.id,
      sectionId: abstractSection.id,
      itemId: abstractItem.id,
      orderIndex: 1,
      status: FormItemMappingStatus.ACTIVE,
    },
  });

  await prisma.formItemMapping.upsert({
    where: { id: 'dev-mapping-numerical-1' },
    update: {
      formId: form.id,
      sectionId: numericalSection.id,
      itemId: numericalItem.id,
      orderIndex: 2,
      status: FormItemMappingStatus.ACTIVE,
    },
    create: {
      id: 'dev-mapping-numerical-1',
      formId: form.id,
      sectionId: numericalSection.id,
      itemId: numericalItem.id,
      orderIndex: 2,
      status: FormItemMappingStatus.ACTIVE,
    },
  });

  const campaign = await prisma.campaign.upsert({
    where: { id: 'dev-campaign-1' },
    update: {
      name: 'Demo Graduate Hiring Campaign',
      organisationId: organisation.id,
      ownerId: employerAdmin.id,
      assessmentFormId: form.id,
      status: CampaignStatus.ACTIVE,
    },
    create: {
      id: 'dev-campaign-1',
      name: 'Demo Graduate Hiring Campaign',
      organisationId: organisation.id,
      ownerId: employerAdmin.id,
      assessmentFormId: form.id,
      status: CampaignStatus.ACTIVE,
    },
  });

  await prisma.invitation.upsert({
    where: { id: 'dev-invitation-1' },
    update: {
      campaignId: campaign.id,
      email: candidateUser.email,
      candidateUserId: candidateUser.id,
      token: 'dev-invitation-token',
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
    create: {
      id: 'dev-invitation-1',
      campaignId: campaign.id,
      email: candidateUser.email,
      candidateUserId: candidateUser.id,
      token: 'dev-invitation-token',
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  console.log('Seed completed successfully');
  console.table({
    platformAdmin: platformAdmin.id,
    employerOrganisation: organisation.id,
    employerAdmin: employerAdmin.id,
    candidateUser: candidateUser.id,
    consumerUser: consumerUser.id,
    assessmentForm: form.id,
    abstractSection: abstractSection.id,
    numericalSection: numericalSection.id,
    abstractItem: abstractItem.id,
    numericalItem: numericalItem.id,
    campaign: campaign.id,
    invitationToken: 'dev-invitation-token',
  });
}

main()
  .catch((error) => {
    console.error('Seed failed');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
