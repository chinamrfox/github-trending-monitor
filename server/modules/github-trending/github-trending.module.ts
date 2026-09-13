import { Module } from '@nestjs/common';
import { GithubTrendingController } from './github-trending.controller';
import { GithubTrendingService } from './github-trending.service';
import { GithubTrendingAutomation } from './github-trending.automation';

@Module({
  controllers: [GithubTrendingController],
  providers: [GithubTrendingService, GithubTrendingAutomation],
  exports: [GithubTrendingService],
})
export class GithubTrendingModule {}
