import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  Res,
  Sse,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name);

  constructor(private reviewsService: ReviewsService) {}

  @Post(':prId/run')
  @ApiOperation({ summary: 'Run a complete review on a pull request' })
  async runReview(
    @Request() req,
    @Param('prId', ParseIntPipe) prId: number,
  ) {
    const result = await this.reviewsService.runReview(prId);
    return { reviewId: result.reviewId, message: 'Review started' };
  }

  @Get(':prId')
  @ApiOperation({ summary: 'Get review for a pull request' })
  getReview(@Request() req, @Param('prId', ParseIntPipe) prId: number) {
    return this.reviewsService.getReview(prId);
  }

  @Get(':prId/stream')
  @ApiOperation({ summary: 'SSE stream for review progress' })
  @Sse()
  async streamReview(
    @Request() req,
    @Param('prId', ParseIntPipe) prId: number,
  ): Promise<Observable<MessageEvent>> {
    const review = await this.reviewsService.getReview(prId);
    const result = await this.reviewsService.runReview(prId);

    return result.stream.pipe(
      map((data) => ({
        data: JSON.stringify(data),
      }) as MessageEvent),
    );
  }

  @Post(':prId/rerun/:agentName')
  @ApiOperation({ summary: 'Re-run a specific agent on a review' })
  rerunAgent(
    @Request() req,
    @Param('prId', ParseIntPipe) prId: number,
    @Param('agentName') agentName: string,
  ) {
    return this.reviewsService.rerunAgent(prId, agentName);
  }

  @Get(':prId/summary')
  @ApiOperation({ summary: 'Get review summary with scores' })
  getSummary(@Request() req, @Param('prId', ParseIntPipe) prId: number) {
    return this.reviewsService.getSummary(prId);
  }

  @Get(':prId/findings')
  @ApiOperation({ summary: 'Get all findings for a review' })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'file', required: false })
  getFindings(
    @Request() req,
    @Param('prId', ParseIntPipe) prId: number,
    @Query('severity') severity?: string,
    @Query('category') category?: string,
    @Query('file') file?: string,
  ) {
    return this.reviewsService.getFindings(prId, { severity, category, file });
  }

  @Get(':prId/findings/stats')
  @ApiOperation({ summary: 'Get finding statistics' })
  getFindingsStats(@Request() req, @Param('prId', ParseIntPipe) prId: number) {
    return this.reviewsService.getFindingsStats(prId);
  }

  @Get(':prId/findings/:findingId')
  @ApiOperation({ summary: 'Get a specific finding' })
  getFinding(
    @Request() req,
    @Param('prId', ParseIntPipe) prId: number,
    @Param('findingId', ParseIntPipe) findingId: number,
  ) {
    return this.reviewsService.getFinding(prId, findingId);
  }
}
