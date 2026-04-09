;(function($) {

  Cookies.set('popup', false, { expires: 7 });

  $('#signupModal').modal({ show: false});

  $('.close.signup').on('click', function(e) {
      Cookies.set('popup', false, { expires: 7 });
  });

  if (Cookies.get('popup') !== 'false') {
    setTimeout(function() {
      $('#signupModal').modal({ show: true});
    }, 5000);
  }

	var _gaq = _gaq || [];

	if ($(window).width() <= 468) { 
    	var src = $('.video-background .bg-video').attr('mobile-link');
    		
    	if ($('.video-background .bg-video').attr('src') != src) {
  			$('.video-background .bg-video').attr('src', src);	
  			$('.video-background').load();
  		}
    }
	
	window.onresize = function() {
    	
    	if (window.innerWidth <= 468) {
    	 
    		var src = $('.video-background .bg-video').attr('mobile-link');
    		
    		if ($('.video-background .bg-video').attr('src') != src) {
  				$('.video-background .bg-video').attr('src', src);
  				$('.video-background').load();
  			}
    	}
    	
    	if (window.innerWidth > 468) {
    	
    		var src = $('.video-background .bg-video').attr('desktop-link');
    		
    		if ($('.video-background .bg-video').attr('src') != src) {
  				$('.video-background .bg-video').attr('src', src);
  				$('.video-background').load();
  			}
    	}
	}


	$( document ).ready(function() {

		$('.roster-items').slick({
  			infinite: true,
  			slidesToShow: 5,
        	responsive: [
        		{
               		breakpoint: 980,
                	settings: {
        			slidesToShow: 2
					}
            	},
            	{
                	breakpoint: 768,
                	settings: {
                    	slidesToShow: 1
					}	
            	}
			]
		});	
		
		$('.roster-items-strategy').slick({
  			infinite: true,
  			slidesToShow: 4,
        	responsive: [
        		{
               		breakpoint: 980,
                	settings: {
        			slidesToShow: 2
					}
            	},
            	{
                	breakpoint: 768,
                	settings: {
                    	slidesToShow: 1
					}	
            	}
			]
		});	
		
		$('.news-items').slick({
  			infinite: true,
  			slidesToShow: 1
		});	
	});
  	
  	$('#contactForm').validator().on('submit', function (e) {
  		if (e.isDefaultPrevented()) {
    		// ERRORS
  		} else {
    		e.preventDefault();
    		submitForm();
  		}
	});
	
	function submitForm(){
 		
 		var postForm = { 
            	'name'    : $("#name").val(),
	            'email'   : $("#email").val(),
	            'message' : $("#message").val()
    	};
 
    	$.ajax({
       		type: 'POST',
        	url: '/wp-content/themes/wma/includes/contact-form.php',
        	data: postForm,
        	success : function(text){
            	if (text == 'success'){
                	formSuccess();
            	} else {
            		formError();
            	}
        	}
    	});
	}

	function formSuccess(){
    	$('#contactForm').fadeOut();
    	$('.thank-you').fadeIn();
    	ga('send', 'event', 'Enquiry', 'EnquirySubmitted');
	}
	
	function formError(){
    	$('.form-error').fadeIn();
	}

	$('#videoThumb').on('click', function(e) {
		e.preventDefault();
	    $("#video")[0].src += "&autoplay=1";
		$(this).fadeOut();
	});

	$(".menu-link a[href^='#']").on('click', function(e) {

		// prevent default anchor click behavior
   		e.preventDefault();

   		// store hash
   		var hash = this.hash;

   		// animate
   		$('html, body').animate({
       		scrollTop: $(hash).offset().top
     	}, 700, function(){

       		// when done, add hash to url
       		// (default click behaviour)
      		 window.location.hash = hash;
     	});

	});

	if ($('#instafeed').length) {
    	var feed = new Instafeed({
        	get: 'user',
    		userId: '613841673',
        	clientId: '70c95f90cbb84bbe9871f2b53bedea0f',
        	accessToken: '613841673.70c95f9.21d9a90d2d4b48d29188067478beee69',
        	limit: 8,
        	sortBy: 'most-recent',
        	orientation: 'square',
        	resolution: "standard_resolution",
        	filter: function(image) {
        		var addHellip = false;
      			var MAX_LENGTH = 130;

		    	if (image.caption && image.caption.text) {
		    		if (image.caption.text.length > MAX_LENGTH) {
      					addHellip = true;
      				}
      				
        			image.short_caption = image.caption.text.slice(0, MAX_LENGTH);

        			if (addHellip) {
        				image.short_caption = image.short_caption + '&hellip;';
        			}
		   		} else {
        			image.short_caption = "";
        		}

      			// ensure the filter doesn't reject any images
      			return true;
    		},
        	template: '<a href="{{link}}" target="_blank"><div class="photo"><div class="photo-box"><div class="image-wrap" style="background-image:url({{image}});"><div class="likes"><i class="glyphicon glyphicon-heart"></i> {{likes}}</div></div><div class="description">{{model.short_caption}}<div class="date">{{model.date}}</div></div></div></div></a>',
    		after: function () {
        		$('.instafeed').slick({ 
        			slidesToShow: 3,
        			responsive: [
                		{
                			breakpoint: 980,
                    		settings: {
                        		slidesToShow: 2
							}
                		},
                		{
                			breakpoint: 768,
                    		settings: {
                        		slidesToShow: 1
							}
                		}
					]
        		});
    		}
    	});
    	
   		feed.run();
    }


	$('.scroll-overlay').on('click', function(e) {
		e.preventDefault();
		$('html, body').animate({
        	scrollTop: ($('#introSection').offset().top - 1)
   		}, 1000);
	});

	$('.overlay h1').delay(1250).fadeTo('slow', 1);
	
	function isScrolledIntoView(element) {
  		var scrollBottomPosition = $(window).scrollTop() + $(window).height();
  		return ($(element).offset().top < scrollBottomPosition);
	}
	
	function addClassIfVisible(element) {
		$(element).each(function () {      
    		if (isScrolledIntoView(this)) {
              	$(this).delay(50).queue('fx', function() { $(this).addClass('start'); });
    		}
  		});
	}
	
	if ($('#introSection').length) {
		var distance = $('#introSection').offset().top;
		var navDistance = $('nav').offset().top;
		var oldPadding = parseInt($('#introSection').css('padding-top'));
		var newPadding = (oldPadding + 98);
		var fired = 0;

		$(window).on( 'scroll', function(){
		
			addClassIfVisible('.service-icon');

			// Change the logo colour when it's out of the viewport
   			if ( $(window).scrollTop() < (distance - 200) ) {
        		$('.navbar-brand').removeClass('navbar-brand-scroll');
   			}
   		
   			// Prepare the header for when it shows white
			if ( $(window).scrollTop() >= (navDistance + 98) ) {
				$('.navbar-brand').addClass('navbar-brand-scroll');
			}
        
       	 	// When intro section IS at top of page
        	if ( $(window).scrollTop() >= distance ) {
        		if (fired == 0) {
	        		fired = 1;
    	    		$('.navbar').addClass('fixed');
        			
        			$('.fixed').css({top:-98}).animate({top:0}, 300);
        			
   				}
   			}
   		
   			// When intro section IS NOT at top of page
   			if ( $(window).scrollTop() < distance ) {
   				if (fired == 1) {
   					fired = 0;
        			$('.navbar').removeClass('fixed');
   				}
   			}
   		});
    }


// function get_spotify() {
// 	$.ajax({
// 		type: 'POST',
// 		url: '/last.fm.php',
// 		data: { request: 'true' },
// 		success: function(reply) {
// 			$('.now-playing').htmll("<p>" + reply + "</p>");
// 		}
// 	});
// }
// 
// get_spotify();

$('#menuLink').on('click', function(e) {
	e.preventDefault();
	$('.fullscreen-menu').animate({ marginTop: 0}, 500);
});

$('.services-link').on('click', function(e) {
	$('.fullscreen-menu').animate({ marginTop: '-110vh'}, 500);
});

$('.fullscreen-menu a.close').on('click', function(e) {
	e.preventDefault();
	$('.fullscreen-menu').animate({ marginTop: '-110vh'}, 500);
});

$('.intro-section').delay(1500).slideToggle('slow', function() {
	$('.intro-section h1 span').each(function(index) {
    	$(this).delay(400*index).fadeTo('slow', 1);
	});
});

$('#london-clock').on('mouseenter', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('.london-clock-hover').fadeToggle('slow', "linear");
  	});
  	
});

$('.london-clock-hover').on('mouseleave', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('#london-clock').fadeToggle('slow', "linear");
  	});
  	
});

$('#nashville-clock').on('mouseenter', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('.nashville-clock-hover').fadeToggle('slow', "linear");
  	});
  	
});

$('.nashville-clock-hover').on('mouseleave', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('#nashville-clock').fadeToggle('slow', "linear");
  	});
  	
});

$('#ny-clock').on('mouseenter', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('.ny-clock-hover').fadeToggle('slow', "linear");
  	});
  	
});

$('.ny-clock-hover').on('mouseleave', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('#ny-clock').fadeToggle('slow', "linear");
  	});
  	
});

$('#la-clock').on('mouseenter', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('.la-clock-hover').fadeToggle('slow', "linear");
  	});
  	
});

$('.la-clock-hover').on('mouseleave', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('#la-clock').fadeToggle('slow', "linear");
  	});
  	
});

$('#melbourne-clock').on('mouseenter', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('.melbourne-clock-hover').fadeToggle('slow', "linear");
  	});
  	
});

$('.melbourne-clock-hover').on('mouseleave', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('#melbourne-clock').fadeToggle('slow', "linear");
  	});
  	
});

$('#berlin-clock').on('mouseenter', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('.berlin-clock-hover').fadeToggle('slow', "linear");
  	});
  	
});

$('.berlin-clock-hover').on('mouseleave', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('#berlin-clock').fadeToggle('slow', "linear");
  	});
  	
});

$('#stockholm-clock').on('mouseenter', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('.stockholm-clock-hover').fadeToggle('slow', "linear");
  	});
  	
});

$('.stockholm-clock-hover').on('mouseleave', function (e) {

	$(this).fadeToggle( "slow", function() {
    	$('#stockholm-clock').fadeToggle('slow', "linear");
  	});
  	
});

}(jQuery));

function calcTime(city, offset) {

	var now = new Date(); 
	var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

    // create Date object for current location
    var d = new Date();

    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    var utc = now_utc.getTime() - (now_utc.getTimezoneOffset() * 60000);

    // create new Date object for different city
    // using supplied offset
    var nd = new Date(utc + (3600000*offset));
    
    var hands = [];
		hands.push(document.querySelector('#' + city + '_secondhand > *'));
		hands.push(document.querySelector('#' + city + '_minutehand > *'));
		hands.push(document.querySelector('#' + city + '_hourhand > *'));

		var cx = 100;
		var cy = 100;

		function shifter(val) {
			return [val, cx, cy].join(' ');
		}

// 	var date = new Date();
	var hoursAngle = 360 * nd.getUTCHours() / 12 + nd.getUTCMinutes() / 2;
	var minuteAngle = 360 * nd.getUTCMinutes() / 60;
	var secAngle = 360 * nd.getUTCSeconds() / 60;

	hands[0].setAttribute('from', shifter(secAngle));
	hands[0].setAttribute('to', shifter(secAngle + 360));
	hands[1].setAttribute('from', shifter(minuteAngle));
	hands[1].setAttribute('to', shifter(minuteAngle + 360));
	hands[2].setAttribute('from', shifter(hoursAngle));
	hands[2].setAttribute('to', shifter(hoursAngle + 360));
   
}

function calcDigitalTime(city, offset) {

	var now = new Date(); 
	var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

    // create Date object for current location
    var d = new Date();

    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    var utc = now_utc.getTime() - (now_utc.getTimezoneOffset() * 60000);

    // create new Date object for different city
    // using supplied offset
    var nd = new Date(utc + (3600000*offset));
    
	var timeClass = '.london-clock-hover';
	if (city == 'ny') {
		timeClass = '.ny-clock-hover';
	} else if  (city == 'la') {
		timeClass = '.la-clock-hover';
	} else if  (city == 'melbourne') {
		timeClass = '.melbourne-clock-hover';
	} else if  (city == 'nashville') {
		timeClass = '.nashville-clock-hover';
	} else if  (city == 'berlin') {
		timeClass = '.berlin-clock-hover';
	} else if  (city == 'stockholm') {
		timeClass = '.stockholm-clock-hover';
	}
	
	document.querySelectorAll(timeClass)[0].innerHTML = harold(nd.getUTCHours()) + ":" + harold(nd.getUTCMinutes()) + ":" + harold(nd.getUTCSeconds());
   
   	function harold(standIn) {
		if (standIn < 10) {
      		standIn = '0' + standIn
   		}
    	return standIn;
  	}
}

function clock() {
	calcTime('london', +0);
	calcTime('ny', -5);
	calcTime('la', -8);
	calcTime('melbourne', +8);
	calcTime('nashville', -6);
	calcTime('berlin', +1);
	calcTime('stockholm', +1);
}

function digitalClock() {
	calcDigitalTime('london', +0);
	calcDigitalTime('ny', -5);
	calcDigitalTime('la', -8);
	calcDigitalTime('melbourne', +8);
	calcDigitalTime('nashville', -6);
	calcDigitalTime('berlin', +1);
	calcDigitalTime('stockholm', +1);
}

clock();
 
window.setInterval(function(){
  digitalClock();
}, 1000);