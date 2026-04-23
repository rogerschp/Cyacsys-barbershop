import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAddresTableAndAddTelephoneToUserTable1776965667642 implements MigrationInterface {
  name = 'CreateAddresTableAndAddTelephoneToUserTable1776965667642';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "street" character varying NOT NULL, "number" character varying NOT NULL, "city" character varying NOT NULL, "state" character varying NOT NULL, "zipCode" character varying NOT NULL, "country" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "telephone" character varying(20)`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "telephone" = '+5500000000000' WHERE "telephone" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "telephone" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "address_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_1b05689f6b6456680d538c3d2ea" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_1b05689f6b6456680d538c3d2ea"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "address_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "telephone"`);
    await queryRunner.query(`DROP TABLE "addresses"`);
  }
}
