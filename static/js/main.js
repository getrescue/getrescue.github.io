/* Show mobile menu */
jQuery(function($) {
  $.ajaxSetup({
    beforeSend: function(xhr, settings) {
      var csrftoken = Cookies.get('csrftoken');
      if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
      }
    }
  });

  $('.mobile-nav-burger').click(function() {
    $('body').addClass('hamburger-expanded');
  });
  $('.mobile-nav-close').click(function() {
    $('body').removeClass('hamburger-expanded');
  });
  $('#contact-us .btn-submit').click(function() {
    var data = getContactData();
    sendContactForm(data);
  });

  scrollOnClick('.learn-more', '#learn-more');

  var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  $('#date-tomorrow').text(prettyDate(tomorrow));
  var nextSunday = getNextDay(0);
  $('#date-next-sunday').text(prettyDate(nextSunday));
});


function sendContactForm(data) {
  $('#contact-us .has-error').removeClass('has-error');
  $.ajax('/contact', {
    method: 'POST',
    data: data
  }).done(function(response) {

  }).fail(function(response) {
    var data = response.responseJSON;
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        showContactFormError(key);
      }
    }
  });
}

function getContactData() {
  var fields = ['name', 'email', 'company', 'title', 'message'];
  return fields.reduce(function(acc, field){
    acc[field] = getContactField(field).val();
    return acc;
  }, {});
}

function showContactFormError(failedField) {
  getContactField(failedField)
    .parent()
    .addClass('has-error');
}

/**
 * Utils
 */

/**
 * Gets the next day of week, i.e. getNextDay(0) returns next sunday's date
 * @param  {Integer} dayOfWeek  0-based day of week
 * @return {Date}
 */
function getNextDay(dayOfWeek) {
  var now = new Date();
  now.setDate(now.getDate() + (dayOfWeek + (7 - now.getDay())) % 7);
  return now;
}

function prettyDate(date) {
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var year = date.getFullYear();
  return month + '-' + day + '-' + year;
}

function scrollOnClick(clickable, destination) {
  $(clickable).click(function(){
    $('html, body').animate({
      scrollTop: $(destination).offset().top
    }, 'slow');
  });
}

function csrfSafeMethod(method) {
  // these HTTP methods do not require CSRF protection
  return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

function getContactField(fieldName) {
  return $('#contact-us #' + fieldName);
}
