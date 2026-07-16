import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
type UploadedExcelFile = {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
};

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('recobros')
  @UseInterceptors(FileInterceptor('file'))
  async importRecobros(@UploadedFile() file: UploadedExcelFile) {
    if (!file) {
      throw new BadRequestException('Debes cargar un archivo Excel.');
    }

    return this.importsService.importRecobrosFromExcel(file);
  }
}