import { Global, Module } from '@nestjs/common';
import {
  drizzleProvider,
  PgPoolLifecycle,
  poolProvider,
} from './drizzle.provider';

@Global()
@Module({
  providers: [poolProvider, drizzleProvider, PgPoolLifecycle],
  exports: [drizzleProvider],
})
export class DatabaseModule {}
