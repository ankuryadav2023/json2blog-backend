import { IsString, IsArray, IsEnum, IsOptional, ValidateNested, IsNotEmpty, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class BlockDto {
    @IsEnum(['text', 'image', 'text-text', 'image-text', 'text-image', 'image-image'])
    type: 'text' | 'image' | 'text-text' | 'image-text' | 'text-image' | 'image-image';

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    text?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    text1?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    text2?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    image?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    image1?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    image2?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    imageAlt?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    imageAlt1?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    imageAlt2?: string;
}

export class EditBlogDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BlockDto)
    content: BlockDto[];
}