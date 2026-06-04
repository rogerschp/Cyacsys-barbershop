import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPlans1781000000001 implements MigrationInterface {
  name = 'SeedPlans1781000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "plans" ("name", "billing_cycle", "price", "sort_weight", "grace_period_days", "features", "is_active")
      VALUES
        (
          'FREE',
          'NONE',
          0.00,
          0,
          0,
          '{"reports":"NONE","reportExport":false,"reviews":false,"marketplace":false,"regionalHighlight":false,"eliteBadge":false,"whatsappNotification":false,"customization":"NONE","maxProfessionals":null}'::jsonb,
          true
        ),
        (
          'STANDARD',
          'MONTHLY',
          89.90,
          1,
          5,
          '{"reports":"BASIC","reportExport":false,"reviews":true,"marketplace":true,"regionalHighlight":false,"eliteBadge":false,"whatsappNotification":false,"customization":"BASIC","maxProfessionals":null}'::jsonb,
          true
        ),
        (
          'PRO',
          'MONTHLY',
          199.90,
          2,
          7,
          '{"reports":"INTERMEDIATE","reportExport":false,"reviews":true,"marketplace":true,"regionalHighlight":true,"eliteBadge":false,"whatsappNotification":true,"customization":"INTERMEDIATE","maxProfessionals":null}'::jsonb,
          true
        ),
        (
          'ELITE',
          'MONTHLY',
          249.90,
          3,
          7,
          '{"reports":"ADVANCED","reportExport":true,"reviews":true,"marketplace":true,"regionalHighlight":true,"eliteBadge":true,"whatsappNotification":true,"customization":"FULL","maxProfessionals":null}'::jsonb,
          true
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "plans" WHERE "name" IN ('FREE', 'STANDARD', 'PRO', 'ELITE')`,
    );
  }
}
