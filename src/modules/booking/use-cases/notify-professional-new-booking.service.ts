import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { TenantProfessionalEntity } from '../../tenant-professional/entities/tenant-professional.entity';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { ServiceEntity } from '../../service/entities/service.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { NotificationEvent } from '../../notification/domain/notification-event.enum';
import { DispatchNotificationUseCase } from '../../notification/use-cases/dispatch-notification.use-case';
import { BookingEntity } from '../entities/booking.entity';

const FALLBACK_TIMEZONE = 'America/Sao_Paulo';

/**
 * Avisa o profissional (BOOKING_CREATED → PUSH + TELEGRAM) que um cliente
 * fez um novo agendamento com ele. A notificação nunca derruba o booking:
 * qualquer falha é apenas logada.
 */
@Injectable()
export class NotifyProfessionalNewBookingService {
  private readonly logger = new Logger(
    NotifyProfessionalNewBookingService.name,
  );

  constructor(
    @InjectRepository(TenantProfessionalEntity)
    private readonly tenantProfessionalRepository: Repository<TenantProfessionalEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Optional()
    private readonly dispatchNotification?: DispatchNotificationUseCase,
  ) {}

  async run(booking: BookingEntity): Promise<void> {
    if (!this.dispatchNotification) return;
    try {
      const [tenantProfessional, tenant, service] = await Promise.all([
        this.tenantProfessionalRepository.findOne({
          where: { id: booking.tenantProfessionalId },
          relations: { professionalProfile: true },
        }),
        this.tenantRepository.findOne({
          where: { id: booking.tenantId },
          relations: { address: true },
        }),
        this.serviceRepository.findOne({ where: { id: booking.serviceId } }),
      ]);

      const recipientUserId = tenantProfessional?.professionalProfile?.userId;
      if (!recipientUserId) {
        this.logger.warn(
          `BOOKING_CREATED: profissional sem usuário resolúvel (booking ${booking.id})`,
        );
        return;
      }

      let clientName = booking.guestName ?? undefined;
      if (!clientName && booking.clientUserId) {
        const client = await this.userRepository.findOne({
          where: { id: booking.clientUserId },
          select: { id: true, name: true },
        });
        clientName = client?.name ?? undefined;
      }

      const timezone = tenant?.timezone || FALLBACK_TIMEZONE;
      const startsAt = DateTime.fromJSDate(new Date(booking.startsAt)).setZone(
        timezone,
      );

      const address = tenant?.address;
      const location = address
        ? [address.street, address.number].filter(Boolean).join(', ') +
          (address.city
            ? ` - ${address.city}${address.state ? `/${address.state}` : ''}`
            : '')
        : undefined;

      await this.dispatchNotification.run({
        event: NotificationEvent.BOOKING_CREATED,
        recipientUserId,
        tenantId: booking.tenantId,
        idempotencyKey: `booking:${booking.id}:BOOKING_CREATED:professional`,
        payload: {
          bookingId: booking.id,
          tenantId: booking.tenantId,
          tenantProfessionalId: booking.tenantProfessionalId,
          tenantName: tenant?.name ?? 'sua barbearia',
          serviceName: service?.name ?? undefined,
          clientName: clientName ?? 'Cliente',
          startsAt: new Date(booking.startsAt).toISOString(),
          dateLabel: startsAt.toFormat('dd/MM/yyyy'),
          timeLabel: startsAt.toFormat('HH:mm'),
          location: location || undefined,
        },
      });
    } catch (error) {
      this.logger.warn(
        `BOOKING_CREATED: falha ao notificar profissional (booking ${booking.id}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
