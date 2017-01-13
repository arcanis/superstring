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
  Line() : ending{LineEnding::NONE} {}
  Line(const std::u16string &content, LineEnding ending) :
    content{content}, ending{ending} {}

  std::u16string content;
  LineEnding ending;
};

struct TextSlice;

struct Text {
  std::vector<Line> lines;

  Text();

  Point Extent() const;
  void Append(TextSlice slice);
  void Write(std::vector<uint16_t> &) const;
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
