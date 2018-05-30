const gulp = require('gulp'),
      twig = require('gulp-twig'),
      fs = require('fs'),
      rename = require('gulp-rename'),
      markdown = require('gulp-markdown').marked,
      puppeteer = require('puppeteer');

const mdRender = new markdown.Renderer();
      mdRender.link = function(href, title, text){
        return `<a target="_blank" href="${href}" title="${text}">${text}</a>`;
      };

const build = (type) => {
  const content = JSON.parse(fs.readFileSync('./src/content.json'));
  content.template = type;

  gulp.src('./src/index.twig')
    .pipe(twig({
      data: content,
      filters: [
        {
          name: "markdown",
          func: function (args) {
            return markdown.inlineLexer(args, [], { renderer: mdRender });
          }
        }
      ]
    }))
    .pipe(rename({
      basename: type,
      extname: ".html"
    }))
    .pipe(gulp.dest( (file) => {

      const html = file.contents.toString();

      (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`data:text/html,${html}`, { waitUntil: 'networkidle0' });
        await page.pdf({ path: `./dist/${type}.pdf`, format: 'A4' });
        await browser.close();
      })();

      return "./dist";
    }));

};

gulp.task('build-cv', () => { build("cv") });
gulp.task('build-coverletter', () => { build("CoverLetter") });

gulp.task('default', ['build-cv']);