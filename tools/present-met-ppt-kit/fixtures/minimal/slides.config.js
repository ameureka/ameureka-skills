module.exports = {
  total: 2,
  footerLeft: "Present Meetup · Fixture",
  pptx: "minimal-fixture.pptx",
  slides: [
    {
      file: "p01-cover.html",
      section: "开场",
      expectedPictures: 0,
      body: `<div class="slide">
        <h1>Present Meetup</h1>
        <p class="lead">最小独立 fixture</p>
        <!--FOOTER-->
      </div>`,
    },
    {
      file: "p02-image.html",
      section: "图片",
      expectedPictures: 1,
      body: `<div class="slide">
        <h2>图片路径验证</h2>
        <div class="shot" data-autofit style="width:240pt; margin:12pt auto 0 auto;">
          <img src="../assets/fixture.png">
        </div>
        <!--FOOTER-->
      </div>`,
    },
  ],
};
