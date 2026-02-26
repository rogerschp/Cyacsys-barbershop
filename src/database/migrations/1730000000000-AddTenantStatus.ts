import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantStatus1730000000000 implements MigrationInterface {
  name = 'AddTenantStatus1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "tenants_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED')
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "status" "tenants_status_enum" NOT NULL DEFAULT 'ACTIVE'
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tenants_status" ON "tenants" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_tenants_status"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "tenants_status_enum"`);
  }
}
