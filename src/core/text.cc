#include "text.h"
#include <limits.h>
#include <vector>
#include <memory>

using std::move;
using std::vector;
using std::unique_ptr;
using std::basic_ostream;

Text::Text() : lines {Line{{}, LineEnding::NONE}} {}

void Text::Append(TextSlice slice) {
  Line &last_line = lines.back();

  if (slice.start.row == slice.end.row) {
    last_line.content.insert(
      last_line.content.end(),
      slice.text->lines[slice.start.row].content.begin() + slice.start.column,
      slice.text->lines[slice.end.row].content.begin() + slice.end.column
    );
  } else {
    last_line.content.insert(
      last_line.content.end(),
      slice.text->lines[slice.start.row].content.begin() + slice.start.column,
      slice.text->lines[slice.start.row].content.end()
    );
    lines.insert(
      lines.end(),
      slice.text->lines.begin() + slice.start.row + 1,
      slice.text->lines.begin() + slice.end.row - 1
    );
    lines.push_back({
      slice.text->lines[slice.end.row].content.substr(0, slice.end.column),
      LineEnding::NONE
    });
  }
}

void Text::Write(vector<uint16_t> &vector) const {
  for (const Line &line : lines) {
    for (char16_t character : line.content) {
      vector.push_back(character);
    }
    switch (line.ending) {
      case LineEnding::NONE:
        break;
      case LineEnding::LF:
        vector.push_back('\n');
        break;
      case LineEnding::CR:
        vector.push_back('\r');
        break;
      case LineEnding::CRLF:
        vector.push_back('\r');
        vector.push_back('\n');
        break;
    }
  }
}

Point Text::Extent() const {
  return Point(lines.size() - 1, lines.back().content.size());
}

TextSlice::TextSlice(Text &text) : text{&text}, start{Point()}, end{text.Extent()} {}

TextSlice::TextSlice(Text *text, Point start, Point end) : text{text}, start{start}, end{end} {}

Text TextSlice::Concat(TextSlice a, TextSlice b) {
  Text result;
  result.Append(a);
  result.Append(b);
  return result;
}

Text TextSlice::Concat(TextSlice a, TextSlice b, TextSlice c) {
  Text result;
  result.Append(a);
  result.Append(b);
  result.Append(c);
  return result;
}

std::pair<TextSlice, TextSlice> TextSlice::Split(Point position) {
  return {
    TextSlice{text, start, position},
    TextSlice{text, position, end}
  };
}

TextSlice TextSlice::Suffix(Point suffix_start) {
  return Split(suffix_start).second;
}

TextSlice TextSlice::Prefix(Point prefix_end) {
  return Split(prefix_end).first;
}

basic_ostream<char16_t> &operator<<(basic_ostream<char16_t> &stream, const Text &text) {
  for (Line line : text.lines) {
    // stream << line.content;
    // stream << line.GetLineEndingString();
  }
  return stream;
}
