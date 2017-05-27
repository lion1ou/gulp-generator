var del = require("del"),
    gulp = require('gulp'), //gulp 基础库
    /////
    less = require('gulp-less'), //编译less
    autoprefixer = require('gulp-autoprefixer'), //css兼容浏览器
    minifycss = require('gulp-clean-css'), //压缩css
    /////
    imagemin = require('gulp-imagemin'), //压缩图片
    pngquant = require('imagemin-pngquant'), //图片压缩png加强插件
    ////
    htmlmin = require("gulp-htmlmin"), //压缩html
    uglify = require("gulp-uglify"), //压缩js
    jshint = require('gulp-jshint'), //校验js代码
    /////                                                  
    rev = require('gulp-rev'), //文件名加MD5后缀
    revCollector = require('gulp-rev-collector'), //路径替换
    /////
    rename = require('gulp-rename'), //重命名
    concat = require('gulp-concat'), //合并文件
    /////
    gulpSequence = require('gulp-sequence'), //控制执行顺序
    browserSync = require('browser-sync').create(); //服务器
/*****************  路径配置  ********************/
var devPath = {
    htmlSrc: './index.html',
    cssSrc: './src/less/*.less',
    imgSrc: './src/images/*',
    libSrc: ['./src/lib/*.min.js', './src/lib/*.min.css'],
    jsSrc: './src/js/*.js',
    ////////////
    htmlDist: './dist/',
    imgDist: './dist/img',
    otherDist: './dist/assets',
};

/*****************  开发环境  ********************/
// HTML处理
gulp.task('dev:html', function() {
    return gulp.src(devPath.htmlSrc)
        .pipe(gulp.dest(devPath.htmlDist))
        .pipe(browserSync.reload({ stream: true }));
});
// 样式处理，less编译
gulp.task('dev:styles', function() {
    return gulp.src(devPath.cssSrc)
        .pipe(less()) //编译less
        .pipe(autoprefixer('iOS >= 7', 'Android >= 4.1')) //自动添加css头
        .pipe(concat('main.css')) //合并css
        .pipe(gulp.dest(devPath.otherDist)) // 重新加载页面
        .pipe(browserSync.reload({ stream: true }));
});
// lib处理
gulp.task('dev:lib', function() {
    return gulp.src(devPath.libSrc)
        .pipe(gulp.dest(devPath.otherDist))
        .pipe(browserSync.reload({ stream: true }));
});
// js处理
gulp.task('dev:js', function() {
    return gulp.src(devPath.jsSrc)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(concat('main.js')) //合并css
        .pipe(gulp.dest(devPath.otherDist))
        .pipe(browserSync.reload({ stream: true }));
});
// 图片处理
gulp.task('dev:images', function() {
    return gulp.src(devPath.imgSrc)
        .pipe(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true,
            use: [pngquant({ quality: '65-80' })]
        }))
        .pipe(gulp.dest(devPath.imgDist))
        .pipe(browserSync.reload({ stream: true }));
});
/*****************  发布环境  ********************/
// 样式处理，less编译
gulp.task('build:styles', function() {
    return gulp.src(devPath.cssSrc)
        .pipe(less()) //编译less
        .pipe(autoprefixer('iOS >= 7', 'Android >= 4.1')) //自动添加css头
        .pipe(concat('main.css')) //合并css
        .pipe(minifycss()) //压缩css
        // .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./temp/')) // 重新加载页面
        .pipe(browserSync.reload({ stream: true }));
});
// lib处理
gulp.task('build:lib', function() {
    return gulp.src(devPath.libSrc)
        .pipe(gulp.dest(devPath.otherDist))
        .pipe(browserSync.reload({ stream: true }));
});
// js处理
gulp.task('build:js', function() {
    return gulp.src(devPath.jsSrc)
        .pipe(concat('main.js')) //合并js
        .pipe(uglify())
        // .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./temp/'))
        .pipe(browserSync.reload({ stream: true }));
});
gulp.task('clean:temp', function() {
    del([
        './temp'
    ]);
});
//引入需要添加后缀的文件
gulp.task('build:md5', function() {
    return gulp.src('./temp/**/*') //引入需要添加后缀的文件
        .pipe(rev())
        .pipe(gulp.dest('./dist/assets'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./temp'));
});
// 修改html的引用文件名称
gulp.task('build:rev', function() {
    gulp.src(['./temp/*.json', devPath.htmlSrc]) //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe(revCollector()) //- 执行文件内css名的替换
        .pipe(gulp.dest('./dist/')); //- 替换后的文件输出的目录
});
// HTML处理
gulp.task('build:html', function() {
    return gulp.src("./dist/index.html")
        .pipe(htmlmin({
            removeComments: true, //清除HTML注释
            collapseWhitespace: true, //压缩HTML
            minifyJS: true, //压缩页面JS
            minifyCSS: true //压缩页面CSS        
        }))
        .pipe(gulp.dest("./dist"))
        .pipe(browserSync.reload({ stream: true }));
});
/*****************  命令设置  ********************/
//clean
gulp.task('clean:dist', function() {
    del([
        './dist/**/*'
    ]);
});
// 静态服务器
gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./dist/"
        },
    });
});
//监听文件变动
gulp.task('watch', function() {
    gulp.watch('src/less/**/*', ['dev:styles']);
    gulp.watch('src/images/**/*(png|jpg|gif)', ['dev:images']);
    gulp.watch('src/js/**/*', ['dev:js']);
    gulp.watch('src/lib/**/*', ['dev:lib']);
    gulp.watch('index.html', ['dev:html']);
});
//开发模式下的命令
gulp.task('dev', gulpSequence('clean:dist', "dev:styles", "dev:lib", "dev:js", "dev:images", 'dev:html', 'server', 'watch'))

//发布正式版本，在开发模式后才能执行发布命令
gulp.task('build', gulpSequence('clean:dist', "build:styles", "build:js", "build:md5", "build:rev", "dev:images", "dev:lib", "build:html", 'clean:temp', 'server'))
