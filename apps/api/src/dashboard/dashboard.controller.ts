import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats(@Request() req) {
    return this.dashboardService.getStats(req.user.id);
  }

  @Get('recent-reviews')
  @ApiOperation({ summary: 'Get recent reviews' })
  getRecentReviews(@Request() req) {
    return this.dashboardService.getRecentReviews(req.user.id);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity' })
  getActivity(@Request() req) {
    return this.dashboardService.getActivity(req.user.id);
  }

  @Get('score-by-category')
  @ApiOperation({ summary: 'Get scores by category' })
  getScoreByCategory(@Request() req) {
    return this.dashboardService.getScoreByCategory(req.user.id);
  }
}
