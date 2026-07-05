import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PreferencesService } from './preferences.service';
import { UserPreference } from '../common/entities/user-preference.entity';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let prefRepo: any;

  const mockPrefRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        { provide: getRepositoryToken(UserPreference), useValue: mockPrefRepo },
      ],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
    prefRepo = module.get(getRepositoryToken(UserPreference));
  });

  describe('getPreferences', () => {
    it('should return existing preferences for a user', async () => {
      const mockPref = { id: 1, userId: 1, languages: 'typescript', styleEnabled: true };
      mockPrefRepo.findOne.mockResolvedValue(mockPref);

      const result = await service.getPreferences(1);
      expect(result).toEqual(mockPref);
    });

    it('should create default preferences when none exist', async () => {
      mockPrefRepo.findOne.mockResolvedValue(null);
      mockPrefRepo.create.mockReturnValue({ id: 2, userId: 999 });
      mockPrefRepo.save.mockResolvedValue({ id: 2, userId: 999 });

      const result = await service.getPreferences(999);

      expect(mockPrefRepo.create).toHaveBeenCalledWith({ userId: 999 });
      expect(mockPrefRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 2, userId: 999 });
    });
  });

  describe('updatePreferences', () => {
    it('should update and return preferences', async () => {
      const existing = {
        id: 1,
        userId: 1,
        languages: 'typescript',
        minSeverity: 'info',
        styleEnabled: true,
        bugEnabled: true,
        securityEnabled: true,
        performanceEnabled: true,
      };
      mockPrefRepo.findOne.mockResolvedValue(existing);
      mockPrefRepo.save.mockResolvedValue({ ...existing, minSeverity: 'major', performanceEnabled: false });

      const result = await service.updatePreferences(1, { minSeverity: 'major', performanceEnabled: false });

      expect(mockPrefRepo.save).toHaveBeenCalled();
      expect(result.minSeverity).toBe('major');
      expect(result.performanceEnabled).toBe(false);
    });

    it('should create preferences if they do not exist on update', async () => {
      mockPrefRepo.findOne.mockResolvedValue(null);
      mockPrefRepo.create.mockReturnValue({ id: 2, userId: 999 });
      mockPrefRepo.save.mockResolvedValue({ id: 2, userId: 999, minSeverity: 'major' });

      const result = await service.updatePreferences(999, { minSeverity: 'major' });

      expect(mockPrefRepo.create).toHaveBeenCalledWith({ userId: 999 });
      expect(result).toHaveProperty('minSeverity', 'major');
    });
  });
});
