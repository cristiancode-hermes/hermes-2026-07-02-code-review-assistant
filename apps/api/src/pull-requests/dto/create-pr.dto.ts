import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrDto {
  @ApiProperty()
  @IsString()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: 'main' })
  @IsString()
  @MaxLength(100)
  baseBranch: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  sourceBranch: string;
}
