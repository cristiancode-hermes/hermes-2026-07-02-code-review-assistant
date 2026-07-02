import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PreferencesService } from './preferences.service';

@ApiTags('Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private prefsService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user preferences' })
  getPreferences(@Request() req) {
    return this.prefsService.getPreferences(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update user preferences' })
  updatePreferences(
    @Request() req,
    @Body()
    body: {
      languages?: string;
      minSeverity?: string;
      styleEnabled?: boolean;
      bugEnabled?: boolean;
      securityEnabled?: boolean;
      performanceEnabled?: boolean;
    },
  ) {
    return this.prefsService.updatePreferences(req.user.id, body);
  }
}
