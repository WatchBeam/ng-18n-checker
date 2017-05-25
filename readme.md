### ng-i18n-checker [![Build Status](https://travis-ci.org/mixer/ng-i18n-checker.svg?branch=master)](https://travis-ci.org/mixer/ng-i18n-checker)

# What does it do?

This utility helps you identifying missing translation strings in html files in a common ng>=2 applications.

If you need to disable the check in a sub tree, use `<!-- i18n-checker:disable -->`.

Example:

```html
<div>
    <!-- i18n-checker:disable -->
    <span>No i18n errors</span> will be reported in this context.
<div>
```

# CLI use:
Run `ng-i18n-checker --help`
