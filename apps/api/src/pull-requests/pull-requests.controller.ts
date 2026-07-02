import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PullRequestsService } from './pull-requests.service';
import { CreatePrDto } from './dto/create-pr.dto';
import { UpdatePrDto } from './dto/update-pr.dto';

@ApiTags('Pull Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repositories/:repoId/prs')
export class PullRequestsController {
  constructor(private prService: PullRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'List all pull requests for a repository' })
  findAll(@Request() req, @Param('repoId', ParseIntPipe) repoId: number) {
    return this.prService.findAll(repoId, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a pull request' })
  create(
    @Request() req,
    @Param('repoId', ParseIntPipe) repoId: number,
    @Body() dto: CreatePrDto,
  ) {
    return this.prService.create(repoId, req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a pull request by ID' })
  findOne(
    @Request() req,
    @Param('repoId', ParseIntPipe) repoId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.prService.findOne(repoId, id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a pull request' })
  update(
    @Request() req,
    @Param('repoId', ParseIntPipe) repoId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrDto,
  ) {
    return this.prService.update(repoId, id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pull request' })
  delete(
    @Request() req,
    @Param('repoId', ParseIntPipe) repoId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.prService.delete(repoId, id, req.user.id);
  }

  @Get(':id/diff')
  @ApiOperation({ summary: 'Get all file diffs for a pull request' })
  getDiff(
    @Request() req,
    @Param('repoId', ParseIntPipe) repoId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.prService.getDiff(repoId, id, req.user.id);
  }

  @Get(':id/diff/:fileId')
  @ApiOperation({ summary: 'Get a specific file diff' })
  getFileDiff(
    @Request() req,
    @Param('repoId', ParseIntPipe) repoId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.prService.getFileDiff(repoId, id, fileId, req.user.id);
  }
}
