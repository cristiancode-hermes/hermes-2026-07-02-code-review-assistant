import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should call authService.register with DTO and return result', async () => {
      const dto = { name: 'Alice', email: 'alice@test.com', password: 'secret' };
      const expected = { token: 'jwt', user: { id: 1, name: 'Alice', email: 'alice@test.com' } };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login with DTO and return result', async () => {
      const dto = { email: 'alice@test.com', password: 'secret' };
      const expected = { token: 'jwt', user: { id: 1, name: 'Alice', email: 'alice@test.com' } };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile with user id from request', async () => {
      const req = { user: { id: 1 } };
      const expected = { id: 1, name: 'Alice', email: 'alice@test.com' };
      mockAuthService.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile(req);

      expect(authService.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('updateProfile', () => {
    it('should call authService.updateProfile with user id and body', async () => {
      const req = { user: { id: 1 } };
      const body = { name: 'Alice Updated', email: 'alice.new@test.com' };
      const expected = { id: 1, name: 'Alice Updated', email: 'alice.new@test.com' };
      mockAuthService.updateProfile.mockResolvedValue(expected);

      const result = await controller.updateProfile(req, body);

      expect(authService.updateProfile).toHaveBeenCalledWith(1, body);
      expect(result).toEqual(expected);
    });
  });
});
