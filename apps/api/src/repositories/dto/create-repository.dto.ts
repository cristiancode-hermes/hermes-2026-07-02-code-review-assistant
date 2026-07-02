import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRepositoryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  localPath: string;

  @ApiPropertyOptional({ default: 'main' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  defaultBranch?: string;
}
