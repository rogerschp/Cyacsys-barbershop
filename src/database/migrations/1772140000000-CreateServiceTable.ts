import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateServiceTable1772140000000 implements MigrationInterface {
  name = 'CreateServiceTable1772140000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "price" decimal(10,2) NOT NULL,
        "duration_in_minutes" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_services_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_services_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_services_price_non_negative" CHECK ("price" >= 0),
        CONSTRAINT "CHK_services_duration_min" CHECK ("duration_in_minutes" >= 5)
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_services_tenant_id" ON "services" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_services_tenant_id_name_active" ON "services" ("tenant_id", "name") WHERE "deletedAt" IS NULL`,
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_services_tenant_id_name_active"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_services_tenant_id"`);
    await queryRunner.query(`DROP TABLE "services"`);
  }
}
