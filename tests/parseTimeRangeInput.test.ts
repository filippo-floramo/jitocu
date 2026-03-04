import { describe, test, expect } from 'bun:test';
import { parseRanges } from '../src/helpers/parseTimeRangeInput';

describe('parseTimeRangeInput', () => {
   const baseDate = new Date('2024-01-15T10:00:00.000Z');

   describe('parseRanges', () => {
      test('should parse a simple time range', () => {
         const result = parseRanges('from 9:00 to 17:00', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('range');
         expect(result[0].start.getHours()).toBe(9);
         expect(result[0].start.getMinutes()).toBe(0);
         expect(result[0].end.getHours()).toBe(17);
         expect(result[0].end.getMinutes()).toBe(0);
         expect(result[0].duration).toBe(8 * 60 * 60 * 1000); // 8 hours
      });

      test('should parse a simple time range with whole hours', () => {
         const result = parseRanges('from 9 to 17', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('range');
         expect(result[0].start.getHours()).toBe(9);
         expect(result[0].start.getMinutes()).toBe(0);
         expect(result[0].end.getHours()).toBe(17);
         expect(result[0].end.getMinutes()).toBe(0);
      });

      test('should parse a duration range', () => {
         const result = parseRanges('from 9:00 duration 4h', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('duration');
         expect(result[0].start.getHours()).toBe(9);
         expect(result[0].start.getMinutes()).toBe(0);
         expect(result[0].end.getHours()).toBe(13);
         expect(result[0].end.getMinutes()).toBe(0);
         expect(result[0].duration).toBe(4 * 60 * 60 * 1000); // 4 hours
      });

      test('should parse a duration range with hours and minutes', () => {
         const result = parseRanges('from 9:30 duration 2h30m', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('duration');
         expect(result[0].start.getHours()).toBe(9);
         expect(result[0].start.getMinutes()).toBe(30);
         expect(result[0].end.getHours()).toBe(12);
         expect(result[0].end.getMinutes()).toBe(0);
         expect(result[0].duration).toBe((2 * 60 + 30) * 60 * 1000); // 2.5 hours
      });

      test('should handle end time earlier than start time (next day)', () => {
         const result = parseRanges('from 22:00 to 2:00', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('range');
         expect(result[0].start.getHours()).toBe(22);
         expect(result[0].start.getMinutes()).toBe(0);
         expect(result[0].end.getHours()).toBe(2);
         expect(result[0].end.getMinutes()).toBe(0);
         expect(result[0].end.getDate()).toBe(baseDate.getDate() + 1);
         expect(result[0].duration).toBe(4 * 60 * 60 * 1000); // 4 hours
      });

      test('should parse multiple ranges with AND', () => {
         const result = parseRanges('from 9:00 to 12:00 and from 13:00 to 17:00', baseDate);
         expect(result).toHaveLength(2);
         
         expect(result[0].type).toBe('range');
         expect(result[0].start.getHours()).toBe(9);
         expect(result[0].end.getHours()).toBe(12);
         
         expect(result[1].type).toBe('range');
         expect(result[1].start.getHours()).toBe(13);
         expect(result[1].end.getHours()).toBe(17);
      });

      test('should parse mixed range types with AND', () => {
         const result = parseRanges('from 9:00 to 12:00 and from 13:00 duration 3h', baseDate);
         expect(result).toHaveLength(2);
         
         expect(result[0].type).toBe('range');
         expect(result[0].start.getHours()).toBe(9);
         expect(result[0].end.getHours()).toBe(12);
         
         expect(result[1].type).toBe('duration');
         expect(result[1].start.getHours()).toBe(13);
         expect(result[1].end.getHours()).toBe(16);
      });

      test('should handle case insensitive input', () => {
         const result = parseRanges('FROM 9:00 TO 17:00', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('range');
         expect(result[0].start.getHours()).toBe(9);
         expect(result[0].end.getHours()).toBe(17);
      });

      test('should handle extra whitespace', () => {
         const result = parseRanges('  from   9:00   to   17:00  ', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('range');
         expect(result[0].start.getHours()).toBe(9);
         expect(result[0].end.getHours()).toBe(17);
      });
   });

   describe('error handling', () => {
      test('should throw error when missing "from"', () => {
         expect(() => parseRanges('9:00 to 17:00', baseDate)).toThrow("Expected 'from' at 0");
      });

      test('should throw error when missing range type', () => {
         expect(() => parseRanges('from 9:00 17:00', baseDate)).toThrow("Expected 'to' or 'duration' at 2");
      });

      test('should throw error for invalid time format', () => {
         expect(() => parseRanges('from invalid to 17:00', baseDate)).toThrow('Invalid time entry: invalid');
      });

      test('should throw error for invalid duration format', () => {
         expect(() => parseRanges('from 9:00 duration invalid', baseDate)).toThrow('Invalid duration format: invalid');
      });

      test('should throw error for invalid duration values', () => {
         expect(() => parseRanges('from 9:00 duration abc', baseDate)).toThrow('Invalid duration format: abc. Expected format: "4h" or "3h20m"');
      });

      test('should throw error for incomplete duration format', () => {
         expect(() => parseRanges('from 9:00 duration 3h', baseDate)).not.toThrow();
         expect(() => parseRanges('from 9:00 duration 3m', baseDate)).toThrow('Invalid duration format: 3m');
      });

      test('should throw error when missing AND between ranges', () => {
         expect(() => parseRanges('from 9:00 to 12:00 from 13:00 to 17:00', baseDate)).toThrow("Expected 'AND' at 4");
      });

      test('should throw error for invalid duration with hours and minutes', () => {
         expect(() => parseRanges('from 9:00 duration abcdef', baseDate)).toThrow('Invalid duration format: abcdef');
         expect(() => parseRanges('from 9:00 duration 3habc', baseDate)).toThrow('Invalid duration format: 3habc');
      });

      test('should throw error for negative or zero hours in duration', () => {
         expect(() => parseRanges('from 9:00 duration 0h', baseDate)).toThrow('Invalid duration hours: 0h');
         expect(() => parseRanges('from 9:00 duration -1h', baseDate)).toThrow('Invalid duration hours: -1h');
      });
   });

   describe('edge cases', () => {
      test('should handle midnight times', () => {
         const result = parseRanges('from 0:00 to 0:00', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('range');
         expect(result[0].start.getHours()).toBe(0);
         expect(result[0].end.getHours()).toBe(0);
         expect(result[0].end.getDate()).toBe(baseDate.getDate() + 1); // Next day
      });

      test('should handle 23:59 start time', () => {
         const result = parseRanges('from 23:59 duration 2h', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('duration');
         expect(result[0].start.getHours()).toBe(23);
         expect(result[0].start.getMinutes()).toBe(59);
         expect(result[0].end.getHours()).toBe(1);
         expect(result[0].end.getMinutes()).toBe(59);
         expect(result[0].end.getDate()).toBe(baseDate.getDate() + 1);
      });

      test('should handle single digit hours without leading zero', () => {
         const result = parseRanges('from 9:5 to 17:30', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('range');
         expect(result[0].start.getHours()).toBe(9);
         expect(result[0].start.getMinutes()).toBe(5);
         expect(result[0].end.getHours()).toBe(17);
         expect(result[0].end.getMinutes()).toBe(30);
      });

      test('should handle duration with only minutes', () => {
         expect(() => parseRanges('from 9:00 duration 30m', baseDate)).toThrow('Invalid duration format: 30m');
      });

      test('should handle complex duration format', () => {
         const result = parseRanges('from 9:00 duration 1h59m', baseDate);
         expect(result).toHaveLength(1);
         expect(result[0].type).toBe('duration');
         expect(result[0].duration).toBe((1 * 60 + 59) * 60 * 1000);
         expect(result[0].end.getHours()).toBe(10);
         expect(result[0].end.getMinutes()).toBe(59);
      });
   });

   describe('return value structure', () => {
      test('should return correct structure for range type', () => {
         const result = parseRanges('from 9:00 to 17:00', baseDate);
         const range = result[0];
         
         expect(range).toHaveProperty('type', 'range');
         expect(range).toHaveProperty('startMs');
         expect(range).toHaveProperty('endMs');
         expect(range).toHaveProperty('start');
         expect(range).toHaveProperty('end');
         expect(range).toHaveProperty('duration');
         expect(range).toHaveProperty('stop');
         
         expect(range.startMs).toBe(range.start.getTime());
         expect(range.endMs).toBe(range.end.getTime());
         expect(range.stop).toBe(range.end.getTime());
         expect(range.duration).toBe(range.endMs - range.startMs);
      });

      test('should return correct structure for duration type', () => {
         const result = parseRanges('from 9:00 duration 4h', baseDate);
         const range = result[0];
         
         expect(range).toHaveProperty('type', 'duration');
         expect(range).toHaveProperty('startMs');
         expect(range).toHaveProperty('endMs');
         expect(range).toHaveProperty('start');
         expect(range).toHaveProperty('end');
         expect(range).toHaveProperty('duration');
         expect(range).toHaveProperty('stop');
         
         expect(range.startMs).toBe(range.start.getTime());
         expect(range.endMs).toBe(range.end.getTime());
         expect(range.stop).toBe(range.end.getTime());
         expect(range.duration).toBe(range.endMs - range.startMs);
      });
   });
});
