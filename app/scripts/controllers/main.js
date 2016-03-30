'use strict';

SwaggerEditor.controller('MainCtrl', function MainCtrl(defaults) {
  // TODO: find a better way to add the branding class (grunt html template)
  $('body').addClass(defaults.brandingCssClass);
});
