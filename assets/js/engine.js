document.addEventListener('DOMContentLoaded', () => {
  var _filename = '';
  var _boundings = [];
  var _boundings_out = [];
  var _b_index = 0;
  var _images_processed = 0;
  var locale = document.documentElement.lang;
  var localizedStrings={
    filesAllowed:{
        'en':'<p>The allowed file formats are jpeg, png<br>The file size limit is 25MB</p>',
        'ru':'<p>Разрешённые типы файлов: jpeg, png<br>Максимальный размер: 25MB</p>'
    },
    notFoundError:{
        'en':'No faces found on uploaded image',
        'ru':'Лица на фото не обнаружены'
    },
    generalNetworkError:{
        'en':'General network error',
        'ru':'Общая ошибка сети'
    },
    identicalFound:{
        'en':'Identical',
        'ru':'Совпадения'
    },
    noIdenticalFound:{
        'en':'No identical found',
        'ru':'Совпадений не найдено'
    },
    similarFound:{
        'en':'Similar',
        'ru':'Похожие'
    },
    noSimilarFound:{
        'en':'No similar found',
        'ru':'Совпадений не найдено'
    },
    otherFound:{
        'en':'Other',
        'ru':'Остальные'
    },
    noOtherFound:{
        'en':'Nothing found',
        'ru':'Остальных не найдено'
    },
    scoreLabel:{
        'en':'score',
        'ru':'совпадение'
    },
    countryLabel:{
        'en':'country',
        'ru':'страна'
    },
    profileLabel:{
        'en':'Link to profile',
        'ru':'Профиль'
    },
    photoLabel:{
        'en':'Photo',
        'ru':'Фото'
    },
    pluralYear1:{
        'en':'years',
        'ru':'год'
    },
    pluralYear2:{
        'en':'years',
        'ru':'года'
    },
    pluralYear3:{
        'en':'years',
        'ru':'лет'
    },
    searchProgress:{
        'en':'Searching',
        'ru':'Идет поиск'
    },
    noneString:{
        'en':'none',
        'ru':'нет'
    },
    birthYear:{
        'en':'Birth year',
        'ru':'Год рождения'
    }
  }

  $('select').trigger('change');


  function status(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(new Error(response.statusText))
    }
  }

  function json(response) {
    return response.json()
  }

  $('#slider-container').slick({
    infinite: false,
    arrows: true,
    prevArrow: '<button class="nav-button prev-next-button previous" type="button" aria-label="Previous"><svg class="button-icon" viewBox="0 0 100 100"><path d="M 10,50 L 60,100 L 70,90 L 30,50  L 70,10 L 60,0 Z" class="arrow"></path></svg></button>',
    nextArrow: '<button class="nav-button prev-next-button next" type="button" aria-label="Next"><svg class="button-icon" viewBox="0 0 100 100"><path d="M 10,50 L 60,100 L 70,90 L 30,50  L 70,10 L 60,0 Z" class="arrow" transform="translate(100, 100) rotate(180) "></path></svg></button>',
    appendArrows: '.slick-nav',
    dots: true,
    appendDots: '.slick-nav'
  });

  $('#slider-container').on('afterChange', function(event, slick, currentSlide) {
    _b_index = currentSlide;
  });

  function handleCanvas(canvas, k) {
    canvas.toBlob((blob) => {
      var o_reader = new FileReader();
      o_reader.readAsDataURL(blob);
      o_reader.k = k;
      o_reader.onload = event => {
          k = event.target.k;
          $('#slider-container').slick('slickAdd', '<div class="slick-item" index="' + k + '"><img id="face-preview" class="img-thumbnail d-block" style="display: block; margin-left: auto; margin-right: auto;" src="' + event.target.result + '" alt=""></div>');
          _boundings_out[_images_processed] = _boundings[k];
          _images_processed++;
          if (_images_processed >= _boundings.length) {
            $("#search-button").prop('disabled', false);
            $('#slider-container').slick('slickGoTo', 0);
          };
      };
    }, 'image/jpeg', 1);
  }

  const upploadPicture = new window.uppload_Uppload({
    value: "https://placehold.it/400x350",
    call: ".uppload-button",
    defaultService: "local",
    lang: window['uppload_'+locale],
    uploader: (file, metadata) => {
        return new Promise((resolve, reject) => {
            fetch("assets/php/upload.php", {
                    method: "POST",
                    body: file
                }).then(status).then(json).then(json => {

                    let url = json.url;
                    if (url) {
                        resolve('Ok');
                        $(".search-results").empty();
                        $(".results-title").empty(); 

                        $('#slider-container').slick('removeSlide', null, null, true);
                        var slides = '';
                        _boundings = json.boundings;
                        _scale = json.scale;
                        _filename = url;
                        _b_index = 0;
                        _boundings_out = [];

                        _images_processed = 0;
                        for (var k = 0; k < _boundings.length; k++) {
                            var reader = new FileReader();
                            reader.k = k;
                            reader.readAsDataURL(file);
                            reader.onload = event => {
                                k = event.target.k;
                                const img = new Image();
                                img.src = event.target.result;
                                img.k = k;
                                img.onload = event => {
                                        k = event.target.k;
                                        const elem = document.createElement('canvas');
                                        const width = 200;

                                        _boundings[k][0] = _boundings[k][0]*_scale;
                                        _boundings[k][1] = _boundings[k][1]*_scale;
                                        _boundings[k][2] = _boundings[k][2]*_scale;
                                        _boundings[k][3] = _boundings[k][3]*_scale;

                                        const height = _boundings[k][3] - _boundings[k][2];
                                        const scaleFactor = width / (_boundings[k][1] - _boundings[k][0]);
                                        elem.width = width;
                                        elem.height = height * scaleFactor;

                                        const ctx = elem.getContext('2d');
                                        ctx.drawImage(img, _boundings[k][0], _boundings[k][2], _boundings[k][1] - _boundings[k][0], _boundings[k][3] - _boundings[k][2], 0, 0, elem.width, elem.height);

                                        handleCanvas(ctx.canvas, k);
                                    },
                                    reader.onerror = error => console.log(error);
                            };
                        };
                    } else {
                        reject(new Error(localizedStrings['notFoundError'][locale])); 
                    };
                })
                .catch(error => reject(new Error(localizedStrings['generalNetworkError'][locale])));          
        });
    }
  });

  const localService = new window.uppload_Local({
    maxFileSize: 26214400,
    mimeTypes: ["image/png", "image/jpeg"]
  });

  upploadPicture.use(
    [localService]
//  new window.uppload_URL(),
//  new window.uppload_Camera()]
  );

  upploadPicture.use(
    [new window.uppload_Preview(),
     new window.uppload_Rotate(),
     new window.uppload_Brightness(),
     new window.uppload_Contrast(),
     new window.uppload_Crop()]
  );

  upploadPicture.on("fileSelected", file => {});

  upploadPicture.on("hide-help", () => {
    if (upploadPicture.isOpen){
      if (upploadPicture.activeService == 'default') upploadPicture.activeService = 'local';
      var prev = document.querySelector('input[name="uppload-effect-radio"][value="preview"]');
      if (prev)prev.checked = true;
    };
  });

  upploadPicture.on("open", () => {
    $(upploadPicture.container).find(".drop-area").append(localizedStrings['filesAllowed'][locale]);
  });

  function replacer(name, val) {
    if ((name === 'results') && (val == '50')) {
      return undefined;
    } else {
      return val;
    }
  };

  function declOfNum(number, titles) {
    cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
  };

  function process_faces(db,faces_found,faces) {
    var count1 = 0;var count2 = 0;var count3 = 0;
    $.each(faces, function(index, value, photoCard) {
        const faceDb = value[0];
        const profile = value[1];
        const face = value[2];
        const photo = (value[3] !== null && value[3] !== "") ? value[3] : "";
        const photoId = value[4];
        const source = (value[9] !== null && value[9] !== "") ? value[9] : "";
        const score = value[10];
        const filtered = value[11];
        const age = (Number.isInteger(value[12]) && (value[12] > 0)) ? (value[12].toString() + " " +  declOfNum(value[12], [localizedStrings['pluralYear1'][locale], localizedStrings['pluralYear2'][locale], localizedStrings['pluralYear3'][locale]])) : ""; 
        const firstName = (value[13] !== null && value[13] !== "") ? value[13] : "";
        const lastName = (value[14] !== null && value[14] !== "") ? value[14] : "";
        const maidenName = (value[15] !== null && value[15] !== "") ? value[15] : "";
        const city = (value[16] !== null && value[16] !== "") ? (" [" + value[16] + "]") : "";
        const country = value[17];
        const born = (value[18] !== null && value[18] !== "" && value[18] !== 0) ? (" [" + value[18] + "]") : "";
        const bio = (value[19] !== null && value[19] !== "") ? value[19] : localizedStrings['noneString'][locale];


       switch (db) {
            case "in00":
                var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profile}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">Username:<br>&nbsp;&nbsp;&nbsp;&nbsp;<a href="${profile}" target="_blank"><u>${maidenName.substring(0, 31)}</u></a></div>\n<div class="card-vk01-bio"><span style="font-size:12px">Bio:</span>${bio.substring(0, 255)}</div>\n<div class="btn-vk01-container">\n<a href="${profile}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                break;
            case "ch00":
                var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profile}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">Username:&nbsp;${maidenName.substring(0, 25)}</div>\n<div class="card-vk01-geo">Bio: ${bio}</div>\n<div class="btn-vk01-container">\n<a href="${profile}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${photoId}" data-imghref="${photoId}">${localizedStrings['photoLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                break;
            case "tt00":
                var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${profile}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)} ${lastName.substring(0, 25)} ${maidenName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">Username: ${lastName.substring(0, 25)}</div>\n<div class="card-vk01-geo">${localizedStrings['countryLabel'][locale]}: ${country}</div>\n<div class="btn-vk01-container">\n<a href="${profile}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                break;
            case "vkok":
                var photoCard = `<div class="col-lg-3 col-md-4 col-xs-6"><div class="face-item">\n<a href="${profile}" class="d-block mb-4 h-100" target="_blank"><span class="source-badge-${faceDb}">${faceDb}</span><span class="percent-badge">${score}%\n</span><span class="info-badge">${firstName.substring(0, 25)} ${lastName.substring(0, 25)} ${maidenName.substring(0, 25)} ${age} ${country}${city}</span><img class="img-fluid img-thumbnail border-primary" style="min-width:100%" src="${face}" alt="">\n</a></div>\n</div>`;
                break; 
            case "vkokn":
                var photoCard = `<div class="col-lg-3 col-md-4 col-xs-6"><div class="face-item">\n<a href="${profile}" class="d-block mb-4 h-100" target="_blank"><span class="source-badge-${faceDb}">${faceDb}</span><span class="percent-badge">${score}%\n</span><span class="info-badge">${firstName.substring(0, 25)} ${lastName.substring(0, 25)} ${maidenName.substring(0, 25)} ${age} ${country}${city}</span><img class="img-fluid img-thumbnail border-primary" style="min-width:100%" src="${face}" alt="">\n</a></div>\n</div>`;
                break; 
            case "sb00":                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${photo}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 75)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName.substring(0, 75)}${born}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-bio mt-1"><span style="font-weight: 600">${bio.substring(0, 255)}</span></div>\n<div class="btn-vk01-container">\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${source}" data-imghref="${photo}">${localizedStrings['photoLabel'][locale]}</a>\n<a href="${profile}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                break;
            default:
                var photoCard = `<div class="card card-vk01 border border-primary">\n<div>\n<div class="card-vk01-fixed">\n<a href="${photo}" target="_blank"><img src="${face}" class="card-img-vk01" alt="${firstName.substring(0, 25)} ${lastName.substring(0, 25)} ${maidenName.substring(0, 25)}"></a>\n</div>\n<div class="col">\n<div class="card-body card-vk01-body">\n<div class="card-vk01-header">${firstName.substring(0, 25)} ${lastName.substring(0, 25)} ${maidenName.substring(0, 25)}</div>\n<div class="card-vk01-score">${localizedStrings['scoreLabel'][locale]}: <span class="score-label">${score}%</span></div>\n<div class="card-vk01-age">${age}${born}</div>\n<div class="card-vk01-geo">${country}${city}</div>\n<div class="btn-vk01-container">\n<a href="${profile}" target="_blank" class="btn-vk01">${localizedStrings['profileLabel'][locale]}</a>\n<a href="#" data-bs-target="#modalIMG" data-bs-toggle="modal" class="btn-vk01" data-imgsrc="${source}" data-imghref="${photo}">${localizedStrings['photoLabel'][locale]}</a>\n</div>\n</div>\n</div>\n</div>\n</div>`;
                break;
        };

        if (score >= 57){
            $("#search-results1").append(photoCard);count1++;
        } else if (score >= 54){
            $("#search-results2").append(photoCard);count2++;
        } else {
            $("#search-results3").append(photoCard);count3++;
        };
    });

    if (count1 > 0){
        $("#results-title1").html(localizedStrings['identicalFound'][locale]);
    } else {
        $("#results-title1").html(localizedStrings['noIdenticalFound'][locale]);
    };
    if (count2 > 0){
        $("#results-title2").html(localizedStrings['similarFound'][locale]);
    } else if (count1 == 0){
        $("#results-title2").html(localizedStrings['noSimilarFound'][locale]);
    };
    if (count3 > 0){
        $("#results-title3").html(localizedStrings['otherFound'][locale]);
    } else if ( (count1 == 0) && (count2 == 0) ){
        $("#results-title3").html(localizedStrings['noOtherFound'][locale]);
    };

  };

  $('#modalIMG').on('show.bs.modal', function(e) {
    var src = e.relatedTarget.dataset.imgsrc;
    var href = e.relatedTarget.dataset.imghref;
    $("#modalIMGsrc").attr("src",src);
    $("#modalIMGhref").attr("href",href);
  });

  $('#search-button').on('click', function(e) {
    var $this = $(this);
    var loadingText = "<i class='fa fa-spinner fa-spin'></i> " + localizedStrings['searchProgress'][locale];

    if ($(this).html() !== loadingText) {
        $this.data('original-text', $(this).html());
        $this.html(loadingText);
        $("#search-fields").prop('disabled', true);
        $(".search-results").empty();
        $(".results-title").empty();

        fetch('assets/php/detect.php', {
            method: 'post',
            body: JSON.stringify({
                query: $('#query').val(),
                source: $('#source').val(),
                results: $('#results').val(),
                lang: locale,
                filename: _filename,
                boundings: _boundings_out[_b_index]
            }, replacer)
        }).then(function(response) {
            return response.json();
        }).then(function(json) {
            process_faces(json.faces_format,json.faces_found,json.faces);
            $this.html($this.data('original-text'));
            $("#search-fields").prop('disabled', false);

            $('html, body').animate({
              scrollTop: $("#results-title1").offset().top - 100
            }, 1000);

        }).catch(err => {
            $this.html($this.data('original-text'));
            $("#search-fields").prop('disabled', false);
        });
    }
  })

});