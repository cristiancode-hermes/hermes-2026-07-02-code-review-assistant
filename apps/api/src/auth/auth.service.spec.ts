import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../common/entities/user.entity';
import { UserPreference } from '../common/entities/user-preference.entity';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedHash'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let prefRepo: any;
  let jwtService: any;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPrefRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(UserPreference), useValue: mockPrefRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    prefRepo = module.get(getRepositoryToken(UserPreference));
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should create a user, hash password, create preferences, and return a token', async () => {
      const dto = { name: 'Alice', email: 'alice@example.com', password: 'secret123' };

      // No existing user
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({
        id: 1,
        name: dto.name,
        email: dto.email,
        passwordHash: 'hashedHash',
      });
      mockUserRepo.save.mockResolvedValue({
        id: 1,
        name: dto.name,
        email: dto.email,
        passwordHash: 'hashedHash',
      });
      mockPrefRepo.create.mockReturnValue({ userId: 1 });
      mockPrefRepo.save.mockResolvedValue({ userId: 1 });

      const result = await service.register(dto);

      // Verify user existence check
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      // Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);

      // Verify user was created with correct data
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        passwordHash: 'hashedHash',
      });
      expect(mockUserRepo.save).toHaveBeenCalled();

      // Verify default preferences were created
      expect(mockPrefRepo.create).toHaveBeenCalledWith({ userId: 1 });
      expect(mockPrefRepo.save).toHaveBeenCalledWith({ userId: 1 });

      // Verify token was generated
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: dto.email,
        name: dto.name,
      });

      // Verify response structure
      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: { id: 1, name: dto.name, email: dto.email },
      });
    });

    it('should throw ConflictException when email is already registered', async () => {
      const dto = { name: 'Bob', email: 'bob@example.com', password: 'secret123' };
      mockUserRepo.findOne.mockResolvedValue({ id: 99, email: dto.email });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockUserRepo.create).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should validate credentials and return a token', async () => {
      const dto = { email: 'alice@example.com', password: 'secret123' };
      const mockUser = {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash: 'hashedHash',
        createdAt: new Date(),
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.login(dto);

      // Verify user lookup with passwordHash selected
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
        select: { id: true, name: true, email: true, passwordHash: true, createdAt: true },
      });

      // Verify bcrypt compare
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, mockUser.passwordHash);

      // Verify token
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: mockUser.email,
        name: mockUser.name,
      });

      // Verify response
      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: { id: 1, name: 'Alice', email: 'alice@example.com' },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'anything' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash: 'hashedHash',
        createdAt: new Date(),
      });

      await expect(
        service.login({ email: 'alice@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile without passwordHash', async () => {
      const mockUser = {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash: 'secret',
        createdAt: new Date(),
        preferences: [],
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(1);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { preferences: true },
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('name', 'Alice');
      expect(result).toHaveProperty('email', 'alice@example.com');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user name and email', async () => {
      const existingUser = {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash: 'secret',
      };
      mockUserRepo.findOne.mockResolvedValue(existingUser);
      mockUserRepo.save.mockResolvedValue({
        ...existingUser,
        name: 'Alice Updated',
        email: 'alice.new@example.com',
      });

      const result = await service.updateProfile(1, {
        name: 'Alice Updated',
        email: 'alice.new@example.com',
      });

      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Alice Updated');
      expect(result.email).toBe('alice.new@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateProfile(999, { name: 'Ghost' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
