import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({
    example: 450,
    description: 'Average monthly consumption (kWh)',
  })
  @IsNumber()
  @Min(0)
  monthlyConsumptionKwh!: number;

  @ApiProperty({ example: 5.4 })
  @IsNumber()
  @Min(0.01)
  systemSizeKw!: number;

  @ApiProperty({ example: 1500, description: 'USD down payment' })
  @IsNumber()
  @Min(0)
  downPayment!: number;

  @ApiPropertyOptional({
    example: '123 Solar Street, Berlin',
    description: 'Installation address (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  installationAddress?: string;
}
