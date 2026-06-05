import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThemeToTenants1782000000001 implements MigrationInterface {
  name = 'AddThemeToTenants1782000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "theme" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN "theme"
    `);
  }
}
