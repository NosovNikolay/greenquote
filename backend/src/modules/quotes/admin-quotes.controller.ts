import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/jwt.strategy';
import { QuotesService } from './quotes.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin/quotes')
export class AdminQuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiOperation({ summary: 'List all quotes (admin)' })
  listAll(@CurrentUser() user: RequestUser, @Query('q') q?: string) {
    if (user.role !== 'admin') {
      throw new ForbiddenException();
    }
    return this.quotesService.listAll(q);
  }
}
