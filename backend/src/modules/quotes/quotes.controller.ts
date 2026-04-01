import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/jwt.strategy';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiOperation({ summary: 'List quotes for the current user' })
  listMine(@CurrentUser() user: RequestUser) {
    return this.quotesService.listMine(user.userId);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Request a solar pre-qualification quote (persisted)',
  })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateQuoteDto) {
    return this.quotesService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one quote (owner or admin)' })
  findOneById(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.findOne(id, user);
  }
}
