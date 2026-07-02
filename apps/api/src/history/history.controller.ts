import { Controller, Get, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HistoryService } from './history.service';

@ApiTags('History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated review history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.historyService.findAll(req.user.id, { page, limit, from, to });
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get score trend over time' })
  getTrend(@Request() req) {
    return this.historyService.getTrend(req.user.id);
  }

  @Get(':reviewId')
  @ApiOperation({ summary: 'Get review detail' })
  getReviewDetail(@Request() req, @Param('reviewId', ParseIntPipe) reviewId: number) {
    return this.historyService.getReviewDetail(reviewId);
  }
}
