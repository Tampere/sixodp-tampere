this.ckan.module('sticky-header', function($, _) {
  return {
    options: {
      limit: 36
    },
    initialize: function() {
      var available = true;
      var el = this.el;
      var limit = this.options.limit;

      $(window).scroll(function() {
        if(available) {
          available = false;

          if ( $(window).scrollTop() >= limit ) {
            el.addClass('navbar-fixed-top')
          }
          else {
            el.removeClass('navbar-fixed-top')
          }

          available = true;
        }
      });
    }
  };
});
