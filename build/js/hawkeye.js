$(document).ready(function() {
  $('.sparkbar').each(function () {
    var $this = $(this);
    $this.sparkline('html', {
      type: 'bar',
      height: $this.data('height') ? $this.data('height') : '30',
      barColor: $this.data('color')
    });
  });

  var scansTable = $('#scans table').DataTable({
    oLanguage: {
      sEmptyTable: '<div align="center">There have not been any scans run against this repository!</div>'
    },
    autoWidth: true,
    columns: [
      { width: '15%' },
      { width: '70%' },
      { width: '15%' }
    ],
    dom: 'Bfrtip',
    buttons: [
      'copyHtml5',
      'csvHtml5'
    ],
    order: [[ 0, 'desc' ]],
    bInfo: false
  });

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
