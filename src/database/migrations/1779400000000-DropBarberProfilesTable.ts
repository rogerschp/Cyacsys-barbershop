import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropBarberProfilesTable1779400000000 implements MigrationInterface {
  name = 'DropBarberProfilesTable1779400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_barber_profiles_tenant_user_id_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_barber_profiles_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "barber_profiles"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "barber_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "tenant_user_id" uuid NOT NULL,
        "display_name" character varying(255) NOT NULL,
        "bio" text,
        "avatar_url" character varying NOT NULL,
        "experience_years" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_barber_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_barber_profiles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_barber_profiles_tenant_user" FOREIGN KEY ("tenant_user_id") REFERENCES "tenant_users"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_barber_profiles_experience_years" CHECK ("experience_years" >= 0)
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_barber_profiles_tenant_id" ON "barber_profiles" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_barber_profiles_tenant_user_id_active" ON "barber_profiles" ("tenant_user_id") WHERE ("deletedAt" IS NULL)`,
    );
  }
}
