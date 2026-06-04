import { IsNotEmpty, IsString } from 'class-validator';

export class AssessmentFormIdParamDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}

export class AssessmentFormRouteParamDto {
  @IsString()
  @IsNotEmpty()
  formId!: string;
}

export class FormItemMappingIdParamDto {
  @IsString()
  @IsNotEmpty()
  mappingId!: string;
}
