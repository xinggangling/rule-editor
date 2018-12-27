const gulp = require('gulp');
const babel = require('gulp-babel');
const importCss = require('gulp-import-css');

gulp.task('js', () => {
		process.env.NODE_ENV = 'production';
    return gulp.src('src/roleEditor.js')
        .pipe(babel({
            presets: ['es2015','react','stage-1']
        }))
        .pipe(gulp.dest('lib'));
});

gulp.task('css', () => {
	return gulp.src(['src/roleEditor.css'])
					.pipe(importCss())
					.pipe(gulp.dest('lib'))
});

gulp.task('fontCss', () => {
	return gulp.src(['src/font/iconfont.css'])
					.pipe(importCss())
					.pipe(gulp.dest('lib/font'))
});


gulp.task('default', ['js', 'css', 'fontCss'])