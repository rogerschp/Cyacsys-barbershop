import { PasswordService } from 'src/common/services/password.service';

describe('PasswordService', () => {
    let service: PasswordService;

    beforeEach(() => {
        service = new PasswordService();
    });

    it('hash produz string diferente do plaintext', async () => {
        const hash = await service.hash('secret-password');
        expect(hash).toBeTruthy();
        expect(hash).not.toBe('secret-password');
        expect(hash.startsWith('$2')).toBe(true);
    });

    it('compare retorna true para senha correta', async () => {
        const hash = await service.hash('my-pass');
        await expect(service.compare('my-pass', hash)).resolves.toBe(true);
    });

    it('compare retorna false para senha incorreta', async () => {
        const hash = await service.hash('a');
        await expect(service.compare('b', hash)).resolves.toBe(false);
    });
});
