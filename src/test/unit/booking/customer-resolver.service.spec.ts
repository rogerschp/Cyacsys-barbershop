import { CustomerResolverService } from 'src/modules/booking/domain/customer-resolver.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

describe('CustomerResolverService', () => {
  const resolver = new CustomerResolverService();

  it('resolve usuário autenticado', () => {
    const identity = resolver.resolve({
      mode: 'authenticated',
      userId: 'user-1',
    });
    expect(identity).toEqual({
      kind: 'USER',
      key: 'user:user-1',
      userId: 'user-1',
      displayName: null,
      phone: null,
      email: null,
    });
  });

  it('resolve guest com telefone normalizado', () => {
    const identity = resolver.resolve({
      mode: 'guest',
      guestName: ' João ',
      guestPhone: '(11) 99999-9999',
    });
    expect(identity.kind).toBe('GUEST');
    expect(identity.key).toBe('guest:5511999999999');
    expect(identity.phone).toBe('5511999999999');
    expect(identity.displayName).toBe('João');
  });

  it('ops: guest e clientUserId juntos → XOR', () => {
    expect(() =>
      resolver.resolve({
        mode: 'ops',
        authenticatedUserId: 'staff',
        clientUserId: 'user-2',
        guestName: 'Maria',
        guestPhone: '11999999999',
      }),
    ).toThrow(BusinessRuleException);
  });

  it('ops: fallback para usuário autenticado', () => {
    const identity = resolver.resolve({
      mode: 'ops',
      authenticatedUserId: 'staff',
    });
    expect(identity.key).toBe('user:staff');
  });

  it('guest sem nome → erro', () => {
    expect(() =>
      resolver.resolve({
        mode: 'guest',
        guestName: '  ',
        guestPhone: '11999999999',
      }),
    ).toThrow(BusinessRuleException);
  });
});
