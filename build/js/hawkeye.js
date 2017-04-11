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
});
