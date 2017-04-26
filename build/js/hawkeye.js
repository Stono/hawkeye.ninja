'use strict';
/* global $ */
/* global document */

$(document).ready(function() {
  $('.sparkbar').each(function () {
    var $this = $(this);
    $this.sparkline('html', {
      type: 'bar',
      height: $this.data('height') ? $this.data('height') : '30',
      barColor: $this.data('color')
    });
  });
  $('.select2').select2();

  var defaultOrg = $('.treeview.active')[0];
  var defaultRepo = $('.repo.active')[0];

  $('#filter-repo').keyup(function() {
    var search = $(this).val().toLowerCase();
    $('.treeview.active').each(function() {
      $(this).removeClass('active');
    });

    $('.repo.active').each(function() {
      $(this).removeClass('active');
    });

    if(search === '') {
      $('.repo').each(function() {
        $(this).show();
      });

      $(defaultOrg).addClass('active');
      $(defaultRepo).addClass('active');
      return;
    }

    $('.repo a').each(function(idx, i) {
      var item = $(i);
      item.parent().hide();
      if(item.text().toLowerCase().indexOf(search) > -1) {
        item.parent().show();
        item.parents('.treeview').addClass('active');
      }
    });

  }).keydown(function(event) {
    if (event.which === 13) {
      event.preventDefault();
    }
  });
});
