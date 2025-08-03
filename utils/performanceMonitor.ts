import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
  renderTime: number;
  searchQueries: number;
  filterChanges: number;
  lastReset: number;
}

interface CacheMetrics {
  searchCacheSize: number;
  filterCacheSize: number;
  chaptersCacheAge: number;
  userProgressCacheAge: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    renderTime: 0,
    searchQueries: 0,
    filterChanges: 0,
    lastReset: Date.now(),
  };

  private cacheMetrics: CacheMetrics = {
    searchCacheSize: 0,
    filterCacheSize: 0,
    chaptersCacheAge: 0,
    userProgressCacheAge: 0,
  };

  private renderStartTime: number = 0;

  constructor() {
    this.loadMetrics();
  }

  private async loadMetrics() {
    try {
      const metricsData = await AsyncStorage.getItem('performance-metrics');
      if (metricsData) {
        this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
      }
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  }

  private async saveMetrics() {
    try {
      await AsyncStorage.setItem('performance-metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Error saving performance metrics:', error);
    }
  }

  // Cache performance tracking
  recordCacheHit() {
    this.metrics.cacheHits++;
    this.saveMetrics();
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
    this.saveMetrics();
  }

  // API performance tracking
  recordApiCall() {
    this.metrics.apiCalls++;
    this.saveMetrics();
  }

  // Render performance tracking
  startRenderTimer() {
    this.renderStartTime = performance.now();
  }

  endRenderTimer() {
    if (this.renderStartTime > 0) {
      const renderTime = performance.now() - this.renderStartTime;
      this.metrics.renderTime = (this.metrics.renderTime + renderTime) / 2; // Average
      this.renderStartTime = 0;
      this.saveMetrics();
    }
  }

  // User interaction tracking
  recordSearchQuery() {
    this.metrics.searchQueries++;
    this.saveMetrics();
  }

  recordFilterChange() {
    this.metrics.filterChanges++;
    this.saveMetrics();
  }

  // Cache metrics tracking
  updateCacheMetrics(metrics: Partial<CacheMetrics>) {
    this.cacheMetrics = { ...this.cacheMetrics, ...metrics };
  }

  // Get performance statistics
  getPerformanceStats() {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalRequests > 0 ? (this.metrics.cacheHits / totalRequests) * 100 : 0;
    const averageRenderTime = this.metrics.renderTime;

    return {
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalRequests,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      apiCalls: this.metrics.apiCalls,
      averageRenderTime: Math.round(averageRenderTime * 100) / 100,
      searchQueries: this.metrics.searchQueries,
      filterChanges: this.metrics.filterChanges,
      uptime: Date.now() - this.metrics.lastReset,
      cacheMetrics: this.cacheMetrics,
    };
  }

  // Get cache efficiency report
  getCacheEfficiencyReport() {
    const stats = this.getPerformanceStats();
    
    return {
      efficiency: stats.cacheHitRate,
      apiCallReduction: this.metrics.cacheHits,
      estimatedTimeSaved: this.metrics.cacheHits * 200, // Assuming 200ms per API call
      cacheUtilization: {
        searchCache: this.cacheMetrics.searchCacheSize,
        filterCache: this.cacheMetrics.filterCacheSize,
        chaptersAge: this.cacheMetrics.chaptersCacheAge,
        progressAge: this.cacheMetrics.userProgressCacheAge,
      },
    };
  }

  // Reset metrics
  async resetMetrics() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      renderTime: 0,
      searchQueries: 0,
      filterChanges: 0,
      lastReset: Date.now(),
    };
    await this.saveMetrics();
  }

  // Export metrics for debugging
  async exportMetrics() {
    const stats = this.getPerformanceStats();
    const efficiency = this.getCacheEfficiencyReport();
    
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      stats,
      efficiency,
    };
  }

  // Log performance summary
  logPerformanceSummary() {
    const stats = this.getPerformanceStats();
    const efficiency = this.getCacheEfficiencyReport();
    
    console.log('=== Performance Summary ===');
    console.log(`Cache Hit Rate: ${stats.cacheHitRate}%`);
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`API Calls Saved: ${efficiency.apiCallReduction}`);
    console.log(`Estimated Time Saved: ${efficiency.estimatedTimeSaved}ms`);
    console.log(`Average Render Time: ${stats.averageRenderTime}ms`);
    console.log(`Uptime: ${Math.round(stats.uptime / 1000 / 60)} minutes`);
    console.log('===========================');
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-log performance summary every 5 minutes in development
if (__DEV__) {
  setInterval(() => {
    performanceMonitor.logPerformanceSummary();
  }, 5 * 60 * 1000);
} 