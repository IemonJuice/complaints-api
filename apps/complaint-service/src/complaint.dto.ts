import {
  IsString,
  IsOptional,
  MinLength,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ComplaintStatus } from './entities/complaint.entity';
export class CreateComplaintDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;
}

export class UpdateComplaintDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;

  @IsEnum(ComplaintStatus)
  @IsOptional()
  status?: ComplaintStatus;
}
