import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogModule } from './blog/blog.module';

@Module({
  imports: [MongooseModule.forRoot(process.env.MONGODB_URI!), BlogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
