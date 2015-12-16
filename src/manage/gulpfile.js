var fs = require('fs');
var _ = require('underscore');
var gulp = require('gulp');
var clean = require('gulp-clean');
var template = require('gulp-template-compile');
var groupConcat = require('gulp-group-concat');
var sass = require('gulp-sass');

gulp.task('clean:tmpl', function() {
    return gulp.src('./static/tmpl/**/*.js', {
            read: false
        })
        .pipe(clean());
});

gulp.task('tmpl', ['clean:tmpl'], function() {
    var groups = {};
    _.each(fs.readdirSync('./static/tmpl'), function(file) {
        if (fs.lstatSync('./static/tmpl/' + file).isDirectory()) {
            groups['tmpl/_' + file + '.js'] = 'static/tmpl/' + file + '/**/*.js';
        }
    });
    return gulp.src('./static/tmpl/**/*.html', {
            base: './static'
        })
        .pipe(template({
            namespace: 'Tmpl',
            name: function(file) {
                return file.relative.replace(/^[^\/\\]+[\/\\]/, '')
                    .replace(/\.html$/, '')
                    .replace(/[\/\\]/g, '_');
            }
        }))
        .pipe(groupConcat(groups))
        .pipe(gulp.dest('./static'));
});

gulp.task('sass', function() {
    return gulp.src('./static/sass/**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./static/css'));
});

gulp.task('default', ['sass', 'tmpl']);
gulp.task('dev', function() {
    gulp.start('tmpl', 'sass');
    gulp.watch('static/tmpl/**/*.html', ['tmpl']);
    gulp.watch('static/sass/**/*.scss', ['sass']);
});
