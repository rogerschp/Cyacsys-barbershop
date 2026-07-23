import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMediaTable1787000000000 implements MigrationInterface {
  name = 'CreateMediaTable1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."media_provider_enum" AS ENUM('CLOUDINARY', 'AWS_S3')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_media_type_enum" AS ENUM('AVATAR', 'LOGO', 'BANNER', 'COVER', 'SERVICE_IMAGE', 'GALLERY', 'DOCUMENT', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_visibility_enum" AS ENUM('PUBLIC', 'PRIVATE', 'TENANT_ONLY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_access_level_enum" AS ENUM('PUBLIC', 'AUTHENTICATED', 'TENANT_MEMBER', 'OWNER_ONLY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_status_enum" AS ENUM('UPLOADING', 'AVAILABLE', 'FAILED', 'DELETED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "media" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" "public"."media_provider_enum" NOT NULL,
        "provider_resource_id" character varying(512) NOT NULL,
        "provider_asset_id" character varying(512),
        "storage_path" character varying(512) NOT NULL,
        "url" character varying(2048) NOT NULL,
        "checksum" character varying(64),
        "original_file_name" character varying(512),
        "mime_type" character varying(128) NOT NULL,
        "extension" character varying(32) NOT NULL,
        "size" integer NOT NULL,
        "width" integer,
        "height" integer,
        "media_type" "public"."media_media_type_enum" NOT NULL,
        "visibility" "public"."media_visibility_enum" NOT NULL,
        "access_level" "public"."media_access_level_enum" NOT NULL,
        "status" "public"."media_status_enum" NOT NULL,
        "failure_reason" character varying(512),
        "tenant_id" uuid,
        "created_by_user_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_media_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_media_tenant_id" ON "media" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_created_by_user_id" ON "media" ("created_by_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_checksum" ON "media" ("checksum")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_media_checksum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_media_created_by_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_media_tenant_id"`);
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`DROP TYPE "public"."media_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_access_level_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_visibility_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_media_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_provider_enum"`);
  }
}
