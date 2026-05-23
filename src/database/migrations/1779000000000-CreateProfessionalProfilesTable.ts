import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfessionalProfilesTable1779000000000 implements MigrationInterface {
  name = 'CreateProfessionalProfilesTable1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."professional_profiles_professional_type_enum" AS ENUM(
        'BARBER',
        'TATTOO_ARTIST',
        'HAIRDRESSER',
        'MANICURE',
        'ESTHETICIAN',
        'LASH_DESIGNER',
        'EYEBROW_DESIGNER'
      )`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."professional_profiles_booking_mode_enum" AS ENUM(
        'DIRECT_BOOKING',
        'QUOTE_REQUIRED',
        'WHATSAPP_ONLY'
      )`,
    );
    await queryRunner.query(`CREATE TABLE "professional_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "display_name" character varying(255) NOT NULL,
        "bio" text,
        "avatar_url" character varying NOT NULL,
        "professional_type" "public"."professional_profiles_professional_type_enum" NOT NULL,
        "booking_mode" "public"."professional_profiles_booking_mode_enum" NOT NULL DEFAULT 'DIRECT_BOOKING',
        "whatsapp_number" character varying(20),
        "instagram_username" character varying(30),
        "experience_years" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_professional_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_professional_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_professional_profiles_experience_years" CHECK ("experience_years" >= 0)
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_professional_profiles_user_id" ON "professional_profiles" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_professional_profiles_user_id_active" ON "professional_profiles" ("user_id") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_professional_profiles_user_id_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_professional_profiles_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "professional_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."professional_profiles_booking_mode_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."professional_profiles_professional_type_enum"`,
    );
  }
}
