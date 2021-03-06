#ifndef POINT_H_
#define POINT_H_

#include <ostream>

struct Point {
  unsigned row;
  unsigned column;

  static Point min(const Point &left, const Point &right);
  static Point max(const Point &left, const Point &right);

  Point();
  Point(unsigned row, unsigned column);

  int compare(const Point &other) const;
  bool is_zero() const;
  Point traverse(const Point &other) const;
  Point traversal(const Point &other) const;

  bool operator==(const Point &other) const;
  bool operator<(const Point &other) const;
  bool operator<=(const Point &other) const;
  bool operator>(const Point &other) const;
  bool operator>=(const Point &other) const;
};

inline std::ostream &operator<<(std::ostream &stream, const Point &point) {
  return stream << "(" << point.row << ", " << point.column << ")";
}

#endif // POINT_H_
