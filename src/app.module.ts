import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AtGuard } from './common/guards';
import { PrismaModule } from './prisma/prisma.module';
import { RequestLoggerMiddleware } from 'middleware/logger';
import { BuildModule } from './build/build.module';
import { StepModule } from './step/step.module';
import { UserModule } from './user/user.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		PrismaModule,
		BuildModule,
		StepModule,
		UserModule,
		AuthModule
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: AtGuard,
		},
	],

})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(RequestLoggerMiddleware).forRoutes("*");
	}
}
