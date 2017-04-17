$(document).ready(function() {
  $('.sparkbar').each(function () {
    var $this = $(this);
    $this.sparkline('html', {
      type: 'bar',
      height: $this.data('height') ? $this.data('height') : '30',
      barColor: $this.data('color')
    });
  });
  $(".select2").select2();

  var defaultOrg = $('.treeview.active')[0];
  var defaultRepo = $('.repo.active')[0];

  $('#filter-repo').keyup(function() {
    var search = $(this).val();
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
    };

    $('.repo a').each(function(idx, i) {
      var item = $(i);
      item.parent().hide();
      if(item.text().indexOf(search) > -1) {
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

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-37161145-3', 'auto');
ga('send', 'pageview');
