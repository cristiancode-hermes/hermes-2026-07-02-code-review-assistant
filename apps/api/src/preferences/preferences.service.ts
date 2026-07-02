import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from '../common/entities/user-preference.entity';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private prefRepo: Repository<UserPreference>,
  ) {}

  async getPreferences(userId: number) {
    let prefs = await this.prefRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefRepo.create({ userId });
      await this.prefRepo.save(prefs);
    }
    return prefs;
  }

  async updatePreferences(
    userId: number,
    data: Partial<{
      languages: string;
      minSeverity: string;
      styleEnabled: boolean;
      bugEnabled: boolean;
      securityEnabled: boolean;
      performanceEnabled: boolean;
    }>,
  ) {
    let prefs = await this.prefRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefRepo.create({ userId });
    }
    Object.assign(prefs, data);
    return this.prefRepo.save(prefs);
  }
}
