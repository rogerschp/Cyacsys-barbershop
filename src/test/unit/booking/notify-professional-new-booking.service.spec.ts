import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { NotifyProfessionalNewBookingService } from 'src/modules/booking/use-cases/notify-professional-new-booking.service';

const booking = {
  id: 'b1',
  tenantId: 'tenant-1',
  tenantProfessionalId: 'tp-1',
  serviceId: 'svc-1',
  clientUserId: 'client-1',
  guestName: null,
  startsAt: new Date('2026-10-23T13:00:00Z'),
} as never;

function make(opts: {
  tp?: unknown;
  tenant?: unknown;
  service?: unknown;
  client?: unknown;
  withDispatch?: boolean;
  throwOnTp?: boolean;
}) {
  const dispatch = { run: jest.fn().mockResolvedValue(undefined) };
  const tpRepo = {
    findOne: opts.throwOnTp
      ? jest.fn().mockRejectedValue(new Error('db down'))
      : jest.fn().mockResolvedValue(opts.tp ?? null),
  };
  const tenantRepo = {
    findOne: jest.fn().mockResolvedValue(opts.tenant ?? null),
  };
  const serviceRepo = {
    findOne: jest.fn().mockResolvedValue(opts.service ?? null),
  };
  const userRepo = {
    findOne: jest.fn().mockResolvedValue(opts.client ?? null),
  };
  const svc = new NotifyProfessionalNewBookingService(
    tpRepo as never,
    tenantRepo as never,
    serviceRepo as never,
    userRepo as never,
    opts.withDispatch === false ? undefined : (dispatch as never),
  );
  return { svc, dispatch, userRepo };
}

describe('NotifyProfessionalNewBookingService', () => {
  it('sem dispatch injetado não faz nada', async () => {
    const { svc } = make({ withDispatch: false });
    await expect(svc.run(booking)).resolves.toBeUndefined();
  });

  it('profissional sem usuário resolúvel não dispara', async () => {
    const { svc, dispatch } = make({ tp: { professionalProfile: null } });
    await svc.run(booking);
    expect(dispatch.run).not.toHaveBeenCalled();
    const semTp = make({ tp: null });
    await semTp.svc.run(booking);
    expect(semTp.dispatch.run).not.toHaveBeenCalled();
  });

  it('happy path: resolve cliente, endereço e dispara BOOKING_CREATED', async () => {
    const { svc, dispatch } = make({
      tp: { professionalProfile: { userId: 'pro-1' } },
      tenant: {
        name: 'Viking',
        timezone: 'America/Sao_Paulo',
        address: { street: 'Rua A', number: '10', city: 'SP', state: 'SP' },
      },
      service: { name: 'Corte' },
      client: { id: 'client-1', name: 'João' },
    });
    await svc.run(booking);
    expect(dispatch.run).toHaveBeenCalledWith(
      expect.objectContaining({
        event: NotificationEvent.BOOKING_CREATED,
        recipientUserId: 'pro-1',
        tenantId: 'tenant-1',
        idempotencyKey: 'booking:b1:BOOKING_CREATED:professional',
        payload: expect.objectContaining({
          tenantName: 'Viking',
          serviceName: 'Corte',
          clientName: 'João',
          location: 'Rua A, 10 - SP/SP',
        }),
      }),
    );
  });

  it('guest: usa guestName e defaults sem tenant/serviço', async () => {
    const { svc, dispatch } = make({
      tp: { professionalProfile: { userId: 'pro-1' } },
    });
    await svc.run({
      ...(booking as object),
      guestName: 'Maria',
      clientUserId: null,
    } as never);
    expect(dispatch.run).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          clientName: 'Maria',
          tenantName: 'sua barbearia',
        }),
      }),
    );
  });

  it('endereço sem cidade e erro de repositório nunca lançam', async () => {
    const { svc, dispatch } = make({
      tp: { professionalProfile: { userId: 'pro-1' } },
      tenant: { name: 'Viking', address: { street: 'Rua B', number: null } },
    });
    await svc.run({ ...(booking as object), guestName: 'Ana' } as never);
    expect(dispatch.run).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ location: 'Rua B' }),
      }),
    );
    const failing = make({ throwOnTp: true });
    await expect(failing.svc.run(booking)).resolves.toBeUndefined();
  });
});
