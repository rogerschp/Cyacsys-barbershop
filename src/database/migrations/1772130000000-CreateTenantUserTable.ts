import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantUserTable1772130000000 implements MigrationInterface {
  name = 'CreateTenantUserTable1772130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_users_role_enum" AS ENUM('OWNER', 'ADMIN', 'BARBER', 'STAFF')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_users_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenant_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "public"."tenant_users_role_enum" NOT NULL,
        "status" "public"."tenant_users_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tenant_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tenant_users_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_tenant_users_tenant_id_user_id" ON "tenant_users" ("tenant_id", "user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_tenant_users_tenant_id_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_users"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_users_role_enum"`);
  }
}
