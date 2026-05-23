import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAddressAndRefactorTenants1778714956648 implements MigrationInterface {
  name = 'AddAddressAndRefactorTenants1778714956648';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP CONSTRAINT "FK_tenant_users_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP CONSTRAINT "FK_tenant_users_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_services_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" DROP CONSTRAINT "FK_barber_profiles_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" DROP CONSTRAINT "FK_barber_profiles_tenant_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_barber_profile"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_service"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_created_by_tenant_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours_periods" DROP CONSTRAINT "FK_working_hours_periods_wh"`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours" DROP CONSTRAINT "FK_working_hours_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours" DROP CONSTRAINT "FK_working_hours_barber_profile"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" DROP CONSTRAINT "FK_barber_time_offs_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" DROP CONSTRAINT "FK_barber_time_offs_barber_profile"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" DROP CONSTRAINT "FK_barber_services_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" DROP CONSTRAINT "FK_barber_services_barber_profile"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" DROP CONSTRAINT "FK_barber_services_service"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" DROP CONSTRAINT "FK_barber_availability_blocks_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" DROP CONSTRAINT "FK_barber_availability_blocks_barber_profile"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" DROP CONSTRAINT "FK_barber_availability_blocks_booking"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_services_tenant_id_name_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_barber_profiles_tenant_user_id_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_bookings_barber_starts_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_working_hours_barber_day_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_barber_services_barber_service_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "CHK_services_price_non_negative"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "CHK_services_duration_min"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" DROP CONSTRAINT "CHK_barber_profiles_experience_years"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "telephone" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" ADD "address_id" uuid`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "socialMedia" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "cnpj" character varying(14)`,
    );
    // Widen telephone without DROP/ADD (would lose data and NOT NULL fails on existing rows).
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "telephone" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."bookings_status_enum" RENAME TO "bookings_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bookings_status_enum" AS ENUM('DRAFT', 'CONFIRMED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "public"."bookings_status_enum" USING "status"::"text"::"public"."bookings_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(`DROP TYPE "public"."bookings_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "FK_4dbfecae1a572949c5d6f2e92b6" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" ADD CONSTRAINT "FK_85a7f13b3f434940151fb44f4c1" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" ADD CONSTRAINT "FK_d53e87bfe2cfc2bf22180bb5f73" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_847c3b57ab049376d3380329a9c" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" ADD CONSTRAINT "FK_601dff351abaea4c3457dcbf27f" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" ADD CONSTRAINT "FK_5276e5372510470e1a2fc4724ad" FOREIGN KEY ("tenant_user_id") REFERENCES "tenant_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_0c41823fa6a879a6aeba1774657" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_9e587df2dc38b8465054a7bd8cb" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_276124109107cd4a79ad100af2e" FOREIGN KEY ("created_by_tenant_user_id") REFERENCES "tenant_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours_periods" ADD CONSTRAINT "FK_8d5edc7eec120470da25d7f4924" FOREIGN KEY ("working_hours_id") REFERENCES "working_hours"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours" ADD CONSTRAINT "FK_d1de13eea8942f65126dabbd422" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours" ADD CONSTRAINT "FK_5bbd6385e8f527d1d1ebded34b2" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" ADD CONSTRAINT "FK_8a89eb307ca0f92fa132291ae6d" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" ADD CONSTRAINT "FK_091831a5e55b456fe7c8111190e" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ADD CONSTRAINT "FK_cd8f5ff2698ec6b86efb5a49b65" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ADD CONSTRAINT "FK_b2e5dc1f96c3779918e4f5d8234" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ADD CONSTRAINT "FK_8b55a829bc87a2406fb3df3d769" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ADD CONSTRAINT "FK_bffe6d279e66f4c841e73b98acc" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ADD CONSTRAINT "FK_fd08d0a8d457fcea18bf31ac0ee" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" DROP CONSTRAINT "FK_fd08d0a8d457fcea18bf31ac0ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" DROP CONSTRAINT "FK_bffe6d279e66f4c841e73b98acc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" DROP CONSTRAINT "FK_8b55a829bc87a2406fb3df3d769"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" DROP CONSTRAINT "FK_b2e5dc1f96c3779918e4f5d8234"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" DROP CONSTRAINT "FK_cd8f5ff2698ec6b86efb5a49b65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" DROP CONSTRAINT "FK_091831a5e55b456fe7c8111190e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" DROP CONSTRAINT "FK_8a89eb307ca0f92fa132291ae6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours" DROP CONSTRAINT "FK_5bbd6385e8f527d1d1ebded34b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours" DROP CONSTRAINT "FK_d1de13eea8942f65126dabbd422"`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours_periods" DROP CONSTRAINT "FK_8d5edc7eec120470da25d7f4924"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_276124109107cd4a79ad100af2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_9e587df2dc38b8465054a7bd8cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_0c41823fa6a879a6aeba1774657"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" DROP CONSTRAINT "FK_5276e5372510470e1a2fc4724ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" DROP CONSTRAINT "FK_601dff351abaea4c3457dcbf27f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_847c3b57ab049376d3380329a9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP CONSTRAINT "FK_d53e87bfe2cfc2bf22180bb5f73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP CONSTRAINT "FK_85a7f13b3f434940151fb44f4c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP CONSTRAINT "FK_4dbfecae1a572949c5d6f2e92b6"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bookings_status_enum_old" AS ENUM('DRAFT', 'CONFIRMED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "public"."bookings_status_enum_old" USING "status"::"text"::"public"."bookings_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."bookings_status_enum_old" RENAME TO "bookings_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "telephone" TYPE character varying(20) USING LEFT("telephone", 20)`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "cnpj"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "socialMedia"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "address_id"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "telephone"`);
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" ADD CONSTRAINT "CHK_barber_profiles_experience_years" CHECK ((experience_years >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "CHK_services_duration_min" CHECK ((duration_in_minutes >= 5))`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "CHK_services_price_non_negative" CHECK ((price >= (0)::numeric))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_barber_services_barber_service_active" ON "barber_services" ("barber_profile_id", "service_id") WHERE ("deletedAt" IS NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_working_hours_barber_day_active" ON "working_hours" ("barber_profile_id", "day_of_week") WHERE ("deletedAt" IS NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_bookings_barber_starts_active" ON "bookings" ("barber_profile_id", "starts_at") WHERE (status = ANY (ARRAY['DRAFT'::bookings_status_enum, 'CONFIRMED'::bookings_status_enum]))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_barber_profiles_tenant_user_id_active" ON "barber_profiles" ("tenant_user_id") WHERE ("deletedAt" IS NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_services_tenant_id_name_active" ON "services" ("tenant_id", "name") WHERE ("deletedAt" IS NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ADD CONSTRAINT "FK_barber_availability_blocks_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ADD CONSTRAINT "FK_barber_availability_blocks_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ADD CONSTRAINT "FK_barber_availability_blocks_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ADD CONSTRAINT "FK_barber_services_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ADD CONSTRAINT "FK_barber_services_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ADD CONSTRAINT "FK_barber_services_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" ADD CONSTRAINT "FK_barber_time_offs_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" ADD CONSTRAINT "FK_barber_time_offs_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours" ADD CONSTRAINT "FK_working_hours_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours" ADD CONSTRAINT "FK_working_hours_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "working_hours_periods" ADD CONSTRAINT "FK_working_hours_periods_wh" FOREIGN KEY ("working_hours_id") REFERENCES "working_hours"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_created_by_tenant_user" FOREIGN KEY ("created_by_tenant_user_id") REFERENCES "tenant_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" ADD CONSTRAINT "FK_barber_profiles_tenant_user" FOREIGN KEY ("tenant_user_id") REFERENCES "tenant_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_profiles" ADD CONSTRAINT "FK_barber_profiles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_services_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" ADD CONSTRAINT "FK_tenant_users_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" ADD CONSTRAINT "FK_tenant_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
