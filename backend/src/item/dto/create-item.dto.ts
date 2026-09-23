import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum ItemType {
  SELL = 'SELL',
  LEND = 'LEND',
}

export class CreateItemDto {
  @IsEnum(ItemType, { message: 'Loại vật phẩm phải là SELL hoặc LEND' })
  @IsNotEmpty({ message: 'Loại vật phẩm không được để trống' })
  type: ItemType;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MinLength(2, { message: 'Tiêu đề phải có ít nhất 2 ký tự' })
  @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự' })
  title: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsOptional()
  @MaxLength(2000, { message: 'Mô tả không được vượt quá 2000 ký tự' })
  description?: string;

  @IsInt({ message: 'ID danh mục phải là số nguyên' })
  @Min(1, { message: 'ID danh mục phải lớn hơn 0' })
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  category_id: number;

  @IsInt({ message: 'Giá trị (VND) phải là số nguyên' })
  @Min(0, { message: 'Giá trị (VND) không được âm' })
  @Max(1000000000, { message: 'Giá trị không được vượt quá 1.000.000.000 VND' })
  price_vnd: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Địa điểm phải là chuỗi' })
  @IsOptional()
  @MaxLength(250, { message: 'Địa điểm không được vượt quá 250 ký tự' })
  location?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'URL hình ảnh phải là chuỗi' })
  @IsOptional()
  @IsUrl({}, { message: 'URL hình ảnh không đúng định dạng URL' })
  @Matches(/^https:\/\/.+/i, { message: 'URL hình ảnh phải sử dụng giao thức HTTPS' })
  image_url?: string;
}
