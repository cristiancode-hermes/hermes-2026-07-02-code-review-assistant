import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RepositoriesService } from './repositories.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';

@ApiTags('Repositories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repositories')
export class RepositoriesController {
  constructor(private reposService: RepositoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all repositories' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    return this.reposService.findAll(req.user.id, { search, sort, order });
  }

  @Post()
  @ApiOperation({ summary: 'Create a repository' })
  create(@Request() req, @Body() dto: CreateRepositoryDto) {
    return this.reposService.create(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a repository by ID' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.reposService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a repository' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRepositoryDto,
  ) {
    return this.reposService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a repository' })
  delete(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.reposService.delete(id, req.user.id);
  }

  @Get(':id/branches')
  @ApiOperation({ summary: 'Get branches for a repository' })
  getBranches(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.reposService.getBranches(id, req.user.id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get repository statistics' })
  getStats(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.reposService.getStats(id, req.user.id);
  }
}
