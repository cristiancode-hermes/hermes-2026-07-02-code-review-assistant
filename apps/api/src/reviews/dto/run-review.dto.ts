import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RunReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentName?: string;
}
