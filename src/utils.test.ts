import { getProgress } from './utils';

describe('utils', () => {
  describe('getProgress', () => {
    it('should return 0 when frame is 0 and totalStars is 0', () => {
      const result = getProgress(0, 100, 0, 30);
      expect(result).toBe(0);
    });

    it('should return totalStars when frame is at or beyond the last frame', () => {
      const result = getProgress(100, 100, 50, 30);
      expect(result).toBe(50);
    });

    it('should return increasing progress values as frame increases', () => {
      const result1 = getProgress(0, 100, 100, 30);
      const result2 = getProgress(50, 100, 100, 30);
      const result3 = getProgress(99, 100, 100, 30);

      expect(result1).toBeLessThanOrEqual(result2);
      expect(result2).toBeLessThanOrEqual(result3);
      expect(result3).toBeCloseTo(100, 0);
    });

    it('should handle different fps values', () => {
      const resultLowFps = getProgress(50, 100, 100, 15);
      const resultHighFps = getProgress(50, 100, 100, 60);
      
      // Both should be reasonable values, but might differ based on fps
      expect(resultLowFps).toBeGreaterThanOrEqual(0);
      expect(resultHighFps).toBeGreaterThanOrEqual(0);
      expect(resultLowFps).toBeLessThanOrEqual(100);
      expect(resultHighFps).toBeLessThanOrEqual(100);
    });

    it('should return 0 when frame is 0', () => {
      const result = getProgress(0, 50, 100, 30);
      expect(result).toBeCloseTo(0, 0);
    });

    it('should return totalStars for the last frame', () => {
      const totalFrames = 60;
      const totalStars = 100;
      const result = getProgress(totalFrames - 1, totalFrames, totalStars, 30);
      expect(result).toBeCloseTo(totalStars, 0);
    });

    it('should handle single frame scenario', () => {
      const result = getProgress(0, 1, 50, 30);
      expect(result).toBeCloseTo(50, 0); // Should reach target in a single step
    });

    it('should handle very small totalStars', () => {
      const result = getProgress(0, 10, 1, 30);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});