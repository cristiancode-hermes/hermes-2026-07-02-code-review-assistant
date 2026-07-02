import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { PullRequestsModule } from './pull-requests/pull-requests.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AgentsModule } from './agents/agents.module';
import { HistoryModule } from './history/history.module';
import { PreferencesModule } from './preferences/preferences.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SeedService } from './seed/seed.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Entities
import { User } from './common/entities/user.entity';
import { Repository } from './common/entities/repository.entity';
import { PullRequest } from './common/entities/pull-request.entity';
import { Review } from './common/entities/review.entity';
import { ReviewFile } from './common/entities/review-file.entity';
import { Finding } from './common/entities/finding.entity';
import { UserPreference } from './common/entities/user-preference.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbPath = config.get<string>('DATABASE_URL') || 'data/code-review.sqlite';
        return {
          type: 'sqljs' as const,
          location: dbPath,
          entities: [
            User,
            Repository,
            PullRequest,
            Review,
            ReviewFile,
            Finding,
            UserPreference,
          ],
          synchronize: true,
          autoLoadEntities: false,
        };
      },
    }),
    TypeOrmModule.forFeature([
      User,
      Repository,
      PullRequest,
      Review,
      ReviewFile,
      Finding,
      UserPreference,
    ]),
    // Serve static files in production
    ...(process.env.NODE_ENV === 'production'
      ? [
          ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            exclude: ['/api/(.*)'],
          }),
        ]
      : []),
    AuthModule,
    RepositoriesModule,
    PullRequestsModule,
    ReviewsModule,
    AgentsModule,
    HistoryModule,
    PreferencesModule,
    DashboardModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
