import { Logger } from '@nestjs/common';
import { Automation, BindTrigger } from '@lark-apaas/fullstack-nestjs-core';
import { GithubTrendingService } from './github-trending.service';

@Automation()
export class GithubTrendingAutomation {
  private readonly logger = new Logger(GithubTrendingAutomation.name);

  constructor(private readonly githubTrendingService: GithubTrendingService) {}

  @BindTrigger('daily_github_trending_fetch')
  async dailyFetch() {
    this.logger.log('开始执行每日 GitHub 热榜抓取任务');
    try {
      const count = await this.githubTrendingService.fetchAllRanges();
      this.logger.log(`每日热榜抓取完成，共获取 ${count} 条数据`);
      return { success: true, count };
    } catch (error) {
      this.logger.error('每日热榜抓取失败', error);
      throw error;
    }
  }
}
