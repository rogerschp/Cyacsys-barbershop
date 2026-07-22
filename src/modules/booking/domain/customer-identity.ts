export type CustomerIdentityKind = 'USER' | 'GUEST';

/**
 * Identidade de cliente usada pelas regras de booking.
 * `key` padronizada evita colisão entre userId e telefone.
 */
export interface CustomerIdentity {
  kind: CustomerIdentityKind;
  /** `user:<uuid>` | `guest:<telefoneNormalizado>` */
  key: string;
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Preenchido quando kind === USER */
  userId?: string | null;
}

export function userIdentityKey(userId: string): string {
  return `user:${userId}`;
}

export function guestIdentityKey(normalizedPhone: string): string {
  return `guest:${normalizedPhone}`;
}

export interface BookingIdentityFields {
  clientUserId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
}

export function toBookingIdentityFields(
  identity: CustomerIdentity,
): BookingIdentityFields {
  if (identity.kind === 'USER') {
    return {
      clientUserId: identity.userId ?? null,
      guestName: null,
      guestPhone: null,
      guestEmail: null,
    };
  }
  return {
    clientUserId: null,
    guestName: identity.displayName ?? null,
    guestPhone: identity.phone ?? null,
    guestEmail: identity.email ?? null,
  };
}
