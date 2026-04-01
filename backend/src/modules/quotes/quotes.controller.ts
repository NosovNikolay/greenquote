import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'List quotes for the current user (paginated)' })
  listMine(
    @CurrentUser() user: RequestUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.quotesService.listMine(user.userId, page, limit);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Request a solar pre-qualification quote (persisted)',
  })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateQuoteDto) {
    return this.quotesService.create(user.userId, dto);
  }

  @Get(':id/amortization')
  @ApiOperation({
    summary: 'Amortization schedule for one installment term (owner or admin)',
  })
  @ApiQuery({
    name: 'termYears',
    required: true,
    enum: [5, 10, 15],
    description: 'Installment term in years (must match a stored offer)',
  })
  getAmortization(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('termYears', ParseIntPipe) termYears: number,
  ) {
    return this.quotesService.getAmortizationSchedule(id, user, termYears);
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
