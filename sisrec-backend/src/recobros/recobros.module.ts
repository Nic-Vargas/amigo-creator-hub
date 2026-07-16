import { Module } from '@nestjs/common';
import { RecobrosService } from './recobros.service';
import { RecobrosController } from './recobros.controller';

@Module({
  controllers: [RecobrosController],
  providers: [RecobrosService],
})
export class RecobrosModule {}