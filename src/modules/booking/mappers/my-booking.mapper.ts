import { DateTime } from 'luxon';
import { AddressEntity } from '../../address/entities/address.entity';
import { BookingEntity } from '../entities/booking.entity';
import {
  MyBookingProfessionalDto,
  MyBookingResponseDto,
  MyBookingServiceDto,
  MyBookingTenantAddressDto,
  MyBookingTenantDto,
} from '../dto/my-booking-response.dto';

function mapAddress(
  address: AddressEntity | null | undefined,
): MyBookingTenantAddressDto | null {
  if (!address) {
    return null;
  }
  return {
    street: address.street,
    number: address.number,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    country: address.country,
  };
}

export function mapBookingToMyBookingResponse(
  booking: BookingEntity,
): MyBookingResponseDto {
  const timezone = booking.tenant?.timezone || 'America/Sao_Paulo';
  const startLocal = DateTime.fromJSDate(booking.startsAt, { zone: 'utc' }).setZone(
    timezone,
  );
  const endLocal = DateTime.fromJSDate(booking.endsAt, { zone: 'utc' }).setZone(
    timezone,
  );

  const tenant: MyBookingTenantDto = {
    id: booking.tenantId,
    name: booking.tenant?.name ?? '',
    slug: booking.tenant?.slug ?? '',
    telephone: booking.tenant?.telephone ?? '',
    timezone,
    address: mapAddress(booking.tenant?.address),
  };

  const professional: MyBookingProfessionalDto = {
    tenantProfessionalId: booking.tenantProfessionalId,
    displayName:
      booking.tenantProfessional?.professionalProfile?.displayName ?? '',
  };

  const service: MyBookingServiceDto = {
    id: booking.serviceId,
    name: booking.service?.name ?? '',
    durationInMinutes: booking.service?.durationInMinutes ?? 0,
  };

  return {
    id: booking.id,
    status: booking.status,
    tenant,
    professional,
    service,
    date: startLocal.toFormat('yyyy-MM-dd'),
    startTime: startLocal.toFormat('HH:mm'),
    endTime: endLocal.toFormat('HH:mm'),
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
  };
}
