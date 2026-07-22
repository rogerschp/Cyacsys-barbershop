import { Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import {
  CustomerIdentity,
  guestIdentityKey,
  userIdentityKey,
} from '../domain/customer-identity';
import { normalizePhone } from '../utils/normalize-phone';

export type ResolveAuthenticatedCustomerInput = {
  mode: 'authenticated';
  userId: string;
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type ResolveGuestCustomerInput = {
  mode: 'guest';
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
};

export type ResolveOpsCustomerInput = {
  mode: 'ops';
  /** Usuário autenticado da equipe (fallback se body não informar identidade). */
  authenticatedUserId: string;
  clientUserId?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
};

export type ResolveCustomerInput =
  | ResolveAuthenticatedCustomerInput
  | ResolveGuestCustomerInput
  | ResolveOpsCustomerInput;

/**
 * Resolve uma identidade única para regras de booking.
 * Hoje: USER (clientUserId) ou GUEST (telefone).
 * Futuro: pode evoluir para Customer sem mudar os use cases.
 */
@Injectable()
export class CustomerResolverService {
  resolve(input: ResolveCustomerInput): CustomerIdentity {
    if (input.mode === 'authenticated') {
      return this.resolveUser(input.userId, {
        displayName: input.displayName,
        phone: input.phone,
        email: input.email,
      });
    }

    if (input.mode === 'guest') {
      return this.resolveGuest(
        input.guestName,
        input.guestPhone,
        input.guestEmail,
      );
    }

    return this.resolveOps(input);
  }

  private resolveOps(input: ResolveOpsCustomerInput): CustomerIdentity {
    const hasGuest =
      Boolean(input.guestPhone?.trim()) || Boolean(input.guestName?.trim());
    const hasUser = Boolean(input.clientUserId?.trim());

    if (hasGuest && hasUser) {
      throw new BusinessRuleException(
        'CUSTOMER_IDENTITY_XOR',
        'Informe clientUserId ou dados de guest, nunca ambos.',
      );
    }

    if (hasGuest) {
      return this.resolveGuest(
        input.guestName ?? '',
        input.guestPhone ?? '',
        input.guestEmail,
      );
    }

    if (hasUser) {
      return this.resolveUser(input.clientUserId!);
    }

    return this.resolveUser(input.authenticatedUserId);
  }

  private resolveUser(
    userId: string,
    extras?: {
      displayName?: string | null;
      phone?: string | null;
      email?: string | null;
    },
  ): CustomerIdentity {
    const id = userId?.trim();
    if (!id) {
      throw new BusinessRuleException(
        'CUSTOMER_IDENTITY_REQUIRED',
        'Identidade do cliente é obrigatória.',
      );
    }
    return {
      kind: 'USER',
      key: userIdentityKey(id),
      userId: id,
      displayName: extras?.displayName ?? null,
      phone: extras?.phone ?? null,
      email: extras?.email ?? null,
    };
  }

  private resolveGuest(
    guestName: string,
    guestPhone: string,
    guestEmail?: string | null,
  ): CustomerIdentity {
    const name = guestName?.trim();
    if (!name) {
      throw new BusinessRuleException(
        'GUEST_NAME_REQUIRED',
        'Nome do visitante é obrigatório.',
      );
    }

    const phone = normalizePhone(guestPhone);
    const email = guestEmail?.trim() ? guestEmail.trim() : null;

    return {
      kind: 'GUEST',
      key: guestIdentityKey(phone),
      userId: null,
      displayName: name,
      phone,
      email,
    };
  }
}
