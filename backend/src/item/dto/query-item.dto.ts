import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ItemType } from './create-item.dto.js';

export enum SortOption {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export class QueryItemDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID danh mục phải là số nguyên' })
  @Min(1, { message: 'ID danh mục phải lớn hơn 0' })
  categoryId?: number;

  @IsOptional()
  @IsEnum(ItemType, { message: 'Loại vật phẩm phải là SELL hoặc LEND' })
  type?: ItemType;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Giá tối thiểu phải là số nguyên' })
  @Min(0, { message: 'Giá tối thiểu không được âm' })
  @Max(2147483647, { message: 'Giá tối thiểu vượt quá giới hạn' })
  minPriceVnd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Giá tối đa phải là số nguyên' })
  @Min(0, { message: 'Giá tối đa không được âm' })
  @Max(2147483647, { message: 'Giá tối đa vượt quá giới hạn' })
  maxPriceVnd?: number;

  @IsOptional()
  @IsEnum(SortOption, { message: 'Tùy chọn sắp xếp không hợp lệ' })
  sort?: SortOption = SortOption.NEWEST;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phần tử mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn hoặc bằng 1' })
  @Max(50, { message: 'Số lượng tối đa mỗi trang là 50' })
  limit?: number = 12;
}

export class QueryMineItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phần tử mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn hoặc bằng 1' })
  @Max(50, { message: 'Số lượng tối đa mỗi trang là 50' })
  limit?: number = 12;
}
