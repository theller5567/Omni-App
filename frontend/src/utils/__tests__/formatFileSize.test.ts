import { formatFileSize } from '../formatFileSize';

describe('formatFileSize', () => {
  test('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  test('formats kilobytes correctly', () => {
    expect(formatFileSize(1500)).toBe('1.46 KB');
  });

  test('formats megabytes correctly', () => {
    expect(formatFileSize(1500000)).toBe('1.43 MB');
  });

  test('formats gigabytes correctly', () => {
    expect(formatFileSize(1500000000)).toBe('1.40 GB');
  });

  test('handles zero correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
}); 