import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientCancelConfirmedSettingsToTenants1783000000000
  implements MigrationInterface
{
  name = 'AddClientCancelConfirmedSettingsToTenants1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "client_can_cancel_confirmed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "client_cancel_confirmed_min_lead_minutes" integer NOT NULL DEFAULT 60`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN "client_cancel_confirmed_min_lead_minutes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN "client_can_cancel_confirmed"`,
    );
  }
}
