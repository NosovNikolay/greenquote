import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({
    example: 'Jane Solar',
    description: 'As entered on the quote form',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

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

  @ApiProperty({ example: 1500, description: 'EUR down payment' })
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
