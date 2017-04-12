$(document).ready(function() {
  $.fn.dataTable.ext.errMode = 'none';

  var defaultTable = function(extra) {
    return Object.assign({
      oLanguage: {
        sEmptyTable: '<div align="center">There have not been any scans run against this repository!</div>'
      },
      autoWidth: true,
      dom: 'Bfrtip',
      buttons: [
        'copyHtml5',
        'csvHtml5'
      ],
      order: [[ 0, 'desc' ]],
      bInfo: false
    }, extra);
  };

  var drawVulnerabilities = function(data) {
    var vulnsTable = $('#vulns table').DataTable(defaultTable({
      columns: [
        { width: '10%', data: 'level' },
        { width: '70%', data: 'description' },
        { width: '20%', data: 'offender' }
      ],
      iDisplayLength: 5,
      order: [[ 0, 'asc' ]],
      data: data.map(function(item) {
        return {
          level: item.level,
          description: item.description + '<br />' + item.extra,
          offender: item.offender
        }
      }),
      createdRow: function(row) {
        var element = $('td', row).eq(0);
        var status = element.text();
        element.html('<span class="label label-' + status + '">' + status + '</span>');
      },
      fnDrawCallback: function() {
        $('#vulns .overlay').hide();
      }
    }));
  };

  var drawGraph = function(data) {
    var labels = data.map(function(row) { return row.number });

    var getData = function(level) {
      var result = data.map(function(scan) {
        return scan.metrics.items.filter(function(item) {
          return item.level === level;
        }).length;
      });
      $('#scanHistory .' + level).text(result[result.length -1]);
      return result;
    };

    var colors = {
      critical: '#dd4b39',
      high: '#FF851B',
      medium: '#f39c12',
      low: '#3c8dbc'
    };

    var dataBlock = function(level) {
      return {
        label: level,
        fillColor:  colors[level],
        strokeColor: colors[level],
        pointColor: colors[level],
        pointStrokeColor: colors[level],
        pointHighlightStroke: colors[level],
        pointHighlightFill: '#fff',
        data: getData(level)
      };
    };

    var areaChartData = {
      labels: labels,
      datasets: [
        dataBlock('critical'),
        dataBlock('high'),
        dataBlock('medium'),
        dataBlock('low')
      ]
    };
    var areaChartOptions = {
      //Boolean - If we should show the scale at all
      showScale: true,
      //Boolean - Whether grid lines are shown across the chart
      scaleShowGridLines: false,
      //String - Colour of the grid lines
      scaleGridLineColor: "rgba(0,0,0,.05)",
      //Number - Width of the grid lines
      scaleGridLineWidth: 1,
      //Boolean - Whether to show horizontal lines (except X axis)
      scaleShowHorizontalLines: true,
      //Boolean - Whether to show vertical lines (except Y axis)
      scaleShowVerticalLines: true,
      //Boolean - Whether the line is curved between points
      bezierCurve: true,
      //Number - Tension of the bezier curve between points
      bezierCurveTension: 0.3,
      //Boolean - Whether to show a dot for each point
      pointDot: false,
      //Number - Radius of each point dot in pixels
      pointDotRadius: 4,
      //Number - Pixel width of point dot stroke
      pointDotStrokeWidth: 1,
      //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
      pointHitDetectionRadius: 20,
      //Boolean - Whether to show a stroke for datasets
      datasetStroke: true,
      //Number - Pixel width of dataset stroke
      datasetStrokeWidth: 2,
      //Boolean - Whether to fill the dataset with a color
      datasetFill: true,
      //String - A legend template
      legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
      //Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
      maintainAspectRatio: true,
      //Boolean - whether to make the chart responsive to window resizing
      responsive: true
    };
    var lineChartCanvas = $("#scanHistory canvas").get(0).getContext("2d");
    var lineChart = new Chart(lineChartCanvas);
    var lineChartOptions = areaChartOptions;
    lineChartOptions.datasetFill = false;
    lineChart.Line(areaChartData, lineChartOptions);
  };

  var scansTable = $('#scans table').DataTable(defaultTable({
    columns: [
      { width: '15%', data: 'number' },
      { width: '70%', data: 'datetime' },
      { width: '15%', data: 'status' }
    ],
    ajax: {
      url: '/api' + window.location.pathname,
      dataSrc: function(data) {
        drawGraph(data.scans);
        drawVulnerabilities(data.scans[data.scans.length -1].metrics.items);
        return data.scans;
      }
    },
    createdRow: function(row) {
      var element = $('td', row).eq(2);
      var status = element.text();
      var labels = {
        fail: 'label-danger',
        pending: 'label-default',
        pass: 'label-success'
      }
      var label = labels[status] || 'default';
      element.html('<span class="label pull-right ' + label + '">' + status + '</span> ');
    },
    fnDrawCallback: function() {
      $('#scans .overlay').hide();
    }
  }));

});
