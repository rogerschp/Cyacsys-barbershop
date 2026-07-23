import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarAndLogoMediaIds1788000000000 implements MigrationInterface {
  name = 'AddAvatarAndLogoMediaIds1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."media_media_type_enum" ADD VALUE IF NOT EXISTS 'USER_AVATAR'`,
    );

    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_media_id" uuid`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "logo_media_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "professional_profiles" ADD "avatar_media_id" uuid`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_avatar_media_id" FOREIGN KEY ("avatar_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "FK_tenants_logo_media_id" FOREIGN KEY ("logo_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_profiles" ADD CONSTRAINT "FK_professional_profiles_avatar_media_id" FOREIGN KEY ("avatar_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN IF EXISTS "avatar_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_profiles" DROP COLUMN IF EXISTS "avatar_url"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "professional_profiles" ADD "avatar_url" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "avatar_url" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "professional_profiles" DROP CONSTRAINT "FK_professional_profiles_avatar_media_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP CONSTRAINT "FK_tenants_logo_media_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_avatar_media_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "professional_profiles" DROP COLUMN "avatar_media_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN "logo_media_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "avatar_media_id"`,
    );
  }
}
