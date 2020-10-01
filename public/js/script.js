


(function ($) {
  'use strict';

  //  Count Up
  function counter() {
    var oTop;
    if ($('.counter').length !== 0) {
      oTop = $('.counter').offset().top - window.innerHeight;
    }
    if ($(window).scrollTop() > oTop) {
      $('.counter').each(function () {
        var $this = $(this),
          countTo = $this.attr('data-count');
        $({
          countNum: $this.text()
        }).animate({
          countNum: countTo
        }, {
          duration: 1000,
          easing: 'swing',
          step: function () {
            $this.text(Math.floor(this.countNum));
          },
          complete: function () {
            $this.text(this.countNum);
          }
        });
      });
    }
  }
  $(window).on('scroll', function () {
    counter();
  });

  // bottom to top
  $('#top').click(function () {
    $('html, body').animate({
      scrollTop: 0
    }, 'slow');
    return false;
  });
  // bottom to top

  $(document).on('ready', function () {

    // Nice Select
    $('select').niceSelect();
    // -----------------------------
    //  Client Slider
    // -----------------------------
    $('.category-slider').slick({
      slidesToShow: 8,
      infinite: true,
      arrows: false,
      autoplay: false,
      autoplaySpeed: 2000
    });
    // -----------------------------
    //  Select Box
    // -----------------------------
    // $('.select-box').selectbox();
    // -----------------------------
    //  Video Replace
    // -----------------------------
    $('.video-box img').click(function () {
      var video = '<iframe allowfullscreen src="' + $(this).attr('data-video') + '"></iframe>';
      $(this).replaceWith(video);
    });
    // -----------------------------
    //  Coupon type Active switch
    // -----------------------------
    $('.coupon-types li').click(function () {
      $('.coupon-types li').not(this).removeClass('active');
      $(this).addClass('active');
    });
    // -----------------------------
    // Datepicker Init
    // -----------------------------
    $('.input-group.date').datepicker({
      format: 'dd/mm/yy'
    });
    // -----------------------------
    // Datepicker Init
    // -----------------------------

    // -----------------------------
    // Button Active Toggle
    // -----------------------------
    $('.btn-group > .btn').click(function () {
      $(this).find('i').toggleClass('btn-active');
    });
    // -----------------------------
    // Coupon Type Select
    // -----------------------------
    $('#online-code').click(function () {
      $('.code-input').fadeIn(500);
    });
    $('#store-coupon, #online-sale').click(function () {
      $('.code-input').fadeOut(500);
    });
    /***ON-LOAD***/
    jQuery(window).on('load', function () {

    });

  });

  // niceSelect

  $('select:not(.ignore)').niceSelect();

  // blog post-slider
  $('.post-slider').slick({
    dots: false,
    arrows: false,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    fade: true
  });

  // Client Slider 
  $('.category-slider').slick({
    dots: false,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1500,
    nextArrow: '<i class="fa fa-chevron-right arrow-right"></i>',
    prevArrow: '<i class="fa fa-chevron-left arrow-left"></i>',
    responsive: [{
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
          dots: false
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          arrows:false
        }
      }
      // You can unslick at a given breakpoint now by adding:
      // settings: "unslick"
      // instead of a settings object
    ]
  });

  // trending-ads-slide 

  $('.trending-ads-slide').slick({
    dots: false,
    arrows: false,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 800,
    responsive: [{
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: false
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
      // You can unslick at a given breakpoint now by adding:
      // settings: "unslick"
      // instead of a settings object
    ]
  });


  // product-slider
  $('.product-slider').slick({
    dots: true,
    arrows: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: false,
    nextArrow: '<i class="fa fa-chevron-right arrow-right"></i>',
    prevArrow: '<i class="fa fa-chevron-left arrow-left"></i>',
    customPaging: function (slider, i) {
      var image = $(slider.$slides[i]).data('image');
      return '<img class="img-fluid" src="' + image + '" alt="product-img">';
    }
  });



  // tooltip
  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });

     // bootstrap slider range
  $('.range-track').slider({});
  $('.range-track').on('slide', function (slideEvt) {
    let minMoney = slideEvt.value[0].toLocaleString('en-US', {style : 'currency', currency : 'VND'});
    let maxMoney = slideEvt.value[1].toLocaleString('en-US', {style : 'currency', currency : 'VND'});
    $('.value').text( minMoney + ' - ' + maxMoney);
  });


})(jQuery);


// Your custom functions
function getDateDiff(date){
  const dateToCheck = new Date(date);

  const today = new Date();
  const yesterday = new Date();
  const twoDayAgo = new Date();
  const threeDayAgo = new Date();
  const fourDayAgo = new Date();
  const fiveDayAgo = new Date();
  const sixDayAgo = new Date();
  const sevenDayAgo = new Date();

  yesterday.setDate(today.getDate() - 1);
  twoDayAgo.setDate(today.getDate() - 2);
  threeDayAgo.setDate(today.getDate() - 3);
  fourDayAgo.setDate(today.getDate() - 4);
  fiveDayAgo.setDate(today.getDate() - 5);
  sixDayAgo.setDate(today.getDate() - 6);
  sevenDayAgo.setDate(today.getDate() - 7);


  if (dateToCheck.toDateString() === today.toDateString()) {
    return "Hôm nay";
  } else if (dateToCheck.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
  } else if (dateToCheck.toDateString() === twoDayAgo.toDateString()) {
      return '2 ngày trước';
  } else if (dateToCheck.toDateString() === threeDayAgo.toDateString()) {
      return '3 ngày trước';
  } else if (dateToCheck.toDateString() === fourDayAgo.toDateString()) {
      return '4 ngày trước';
  } else if (dateToCheck.toDateString() === fiveDayAgo.toDateString()) {
      return '5 ngày trước';
  } else if (dateToCheck.toDateString() === sixDayAgo.toDateString()) {
      return '6 ngày trước';
  } else if (dateToCheck.toDateString() === sevenDayAgo.toDateString()) {
      return '7 ngày trước';
  } else {
      return false;
  }
}

$(document).ready(function () {

  $('.navbar .dropdown-item').on('click', function (e) {
      var $el = $(this).children('.dropdown-toggle');
      var $parent = $el.offsetParent(".dropdown-menu");
      if(typeof $el[0] === 'undefined') {
        location.replace($(this).attr('href'))
        return false;
      }
      $(this).parent("li").toggleClass('open');
  
      if (!$parent.parent().hasClass('navbar-nav')) {
          if ($parent.hasClass('show')) {
              $parent.removeClass('show');
              $el.next().removeClass('show');
              $el.next().css({"top": -999, "left": -999});
          } else {
              $parent.parent().find('.show').removeClass('show');
              $parent.addClass('show');
              $el.next().addClass('show');
              $el.next().css({"top": $el[0].offsetTop, "left": $parent.outerWidth() - 4});
          }
          e.preventDefault();
          e.stopPropagation();
      }
  });
  
  $('.navbar .dropdown').on('hidden.bs.dropdown', function () {
      $(this).find('li.dropdown').removeClass('show open');
      $(this).find('ul.dropdown-menu').removeClass('show open');
  });
  
  });

