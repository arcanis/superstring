#ifndef TEXT_H_
#define TEXT_H_

#include <memory>
#include <vector>
#include <ostream>
#include "point.h"

enum class LineEnding : uint8_t {
  NONE,
  LF,
  CR,
  CRLF
};

struct Line {
  std::u16string content;
  LineEnding ending;

  std::u16string GetLineEndingString () const {
    switch (ending) {
      case LineEnding::NONE:
        return {};
      case LineEnding::LF:
        return {'\n'};
      case LineEnding::CR:
        return {'\r'};
      case LineEnding::CRLF:
        return {'\r', '\n'};
    }
  }

  size_t GetLineEndingLength () const {
    switch (ending) {
      case LineEnding::NONE:
        return 0;
      case LineEnding::LF:
      case LineEnding::CR:
        return 1;
      case LineEnding::CRLF:
        return 2;
    }
  }
};

struct TextSlice;

struct Text {
  std::vector<Line> lines;

  Text();

  Point Extent() const;
  size_t Size() const;
  void Append(TextSlice slice);
  void Append(std::vector<char16_t> begin, std::iterator<char16_t> begin);
};

struct TextSlice {
  Text *text;
  Point start;
  Point end;

  static Text Concat(TextSlice a, TextSlice b);
  static Text Concat(TextSlice a, TextSlice b, TextSlice c);

  TextSlice(Text &text);
  TextSlice(Text *text, Point start, Point end);

  std::pair<TextSlice, TextSlice> Split(Point);
  TextSlice Prefix(Point);
  TextSlice Suffix(Point);
};

std::ostream &operator<<(std::ostream &stream, const Text *text);

#endif  // TEXT_H_
