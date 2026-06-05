import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSegmentAvatarAndCoordinatesToTenants1782000000000 implements MigrationInterface {
  name = 'AddSegmentAvatarAndCoordinatesToTenants1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_segment_enum" AS ENUM('BARBERSHOP', 'TATTOO_STUDIO', 'HAIR_SALON', 'NAIL_STUDIO', 'BEAUTY_SALON', 'OTHER')`,
    );

    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "segment" "public"."tenant_segment_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "avatar_url" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "latitude" decimal(10,8)`,
    );

    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "longitude" decimal(11,8)`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_tenants_latitude_longitude" ON "tenants" ("latitude", "longitude")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tenants_latitude_longitude"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "latitude"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "avatar_url"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "segment"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_segment_enum"`);
  }
}
