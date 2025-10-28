// gulpfile.js
const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleanCSS = require('gulp-clean-css');
const cssbeautify = require('gulp-cssbeautify');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create();
const { deleteSync } = require('del');
const path = {
  scss: 'assets/scss/**/*.scss',
  cssDest: 'assets/css',
  js: 'assets/js/**/*.js',
  html: './*.html',
  dist: 'dist'
};

// Очистка dist
function clean() {
  deleteSync([path.dist + '/**', '!' + path.dist]);
  return Promise.resolve();
}

// Компиляция SCSS -> CSS (читабельная версия) и минификация (в dist)
function styles() {
  // читабельная версия (dev) -> assets/css/style.css (+ sourcemap)
  const main = src(path.scss)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(cssbeautify({ indent: '  ' }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(path.cssDest))
    .pipe(browserSync.stream());

  // минифицированная версия -> dist/css/style.min.css
  const min = src(path.scss)
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS({ level: { 1: { specialComments: 0 }}}))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(path.dist + '/css'));

  return main; // gulp ожидает поток; min выполняется параллельно (но main возвращаем)
}

// Копируем HTML и JS в dist (для финальной сборки)
function copyHtml() {
  return src(path.html).pipe(dest(path.dist));
}
function copyJs() {
  return src(path.js).pipe(dest(path.dist + '/js'));
}

// Сервер и наблюдение
function serve() {
  browserSync.init({
    server: {
      baseDir: './'
    },
    notify: false,
    open: true
  });

  watch(path.scss, styles);
  watch(path.html).on('change', browserSync.reload);
  watch(path.js).on('change', browserSync.reload);
}

// Полная сборка (для продакшена)
const build = series(clean, styles, parallel(copyHtml, copyJs));

// Дефолт — режим разработки
exports.default = series(styles, serve);
exports.build = build;
exports.clean = clean;
