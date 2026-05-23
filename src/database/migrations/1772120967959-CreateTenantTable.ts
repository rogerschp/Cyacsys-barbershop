import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateTenantTable1772120967959 implements MigrationInterface {
  name = 'CreateTenantTable1772120967959';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tenants_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2310ecc5cb8be427097154b18f" ON "tenants" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c59559e7872bc9726adef4669f" ON "tenants" ("status") `,
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c59559e7872bc9726adef4669f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2310ecc5cb8be427097154b18f"`,
    );
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
  }
}
