'use strict';
/* global $ */
/* global document */
/* global window */
/* global showdown */
/* global alert */
/* global Chart */

var scanFrequency = '#scanFrequency';
var notifyWhen = '#notifyWhen';
var emailNotification = '#emailNotification';
var github = '#githubIntegration';
var saveSchedule = '#saveSchedule';

var ajaxData;

var linkify = function(value) {
  // http://, https://, ftp://
  var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

  // www. sans http:// or https://
  var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

  // Email addresses
  var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

  return value
  .replace(urlPattern, '<a target="_blank" href="$&">$&</a>')
  .replace(pseudoUrlPattern, '$1<a target="_blank" href="http://$2">$2</a>')
  .replace(emailAddressPattern, '<a target="_blank" href="mailto:$&">$&</a>');
};

$(document).ready(function() {
  var converter = new showdown.Converter();
  //$.fn.dataTable.ext.errMode = 'none';

  var defaultTable = function(extra) {
    return Object.assign({
      oLanguage: {
        sEmptyTable: '<div align="center">No data to show.</div>',
        sSearch: '',
        sSearchPlaceholder: 'Search'
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
    var vulnTable = defaultTable({
      columns: [
        { width: '5%', data: 'level' },
        { width: '95%', data: 'description' }
      ],
      iDisplayLength: 5,
      order: [[ 0, 'asc' ]],
      data: data.map(function(item) {
        var label = '<span class="label label-' + item.level + '">' + item.level + '</span>';
        var title = '<div class="scan-label">Title:</div> ' + item.description;
        var mitigation = linkify(item.mitigation);
        var advisory = '<div class="scan-label">Advisory:</div> ' + mitigation;
        var offender = '<div class="scan-label">Offender:</div> ' + item.offender;

        var extra = '';
        Object.keys(item.data).forEach(function(key) {
          /* jshint maxcomplexity: 7 */
          var value = item.data[key];
          if(key === 'path' && item.module === 'nsp') {
            value = value.join(' -> ');
          }
          if(typeof value === 'object') { return; }
          if(value === undefined || value === null) { return; }
          if(key === 'overview' && item.module === 'nsp') {
            value = converter.makeHtml(value);
            extra = extra + '<div class="scan-label">' + key + ':</div><br/>' + value + '<br/>';
          } else {
            if(typeof value === 'string') {
              value = linkify(value);
            }
            extra = extra + '<div class="scan-label">' + key + ':</div>' + value + '<br/>';
          }
        });
        extra = '<div class="scan-label-group scan-extra">' + extra + '</extra>';
        var description = '<div class="scan-label-group">' + title + '<br/>' + offender + '<br />' + advisory +  '</div>' + extra;
        return {
          level: label,
          description: description,
          raw: item
        };
      }),
      fnDrawCallback: function() {
        $('#vulns .overlay').hide();
      }
    });
    $('#vulns table').DataTable(vulnTable);

    $('#vulns tbody').on( 'click', 'tr', function () {
      if ( $(this).hasClass('selected') ) {
        $(this).find('.scan-extra').slideUp();
        $(this).removeClass('selected');
      }
      else {
        $(this).find('.scan-extra').slideDown();
        $(this).addClass('selected');
      }
    });
  };

  var colors = {
    critical: '#dd4b39',
    high: '#FF851B',
    medium: '#f39c12',
    low: '#3c8dbc'
  };

  var drawPie = function(data) {
    var pieChartCanvas = $("#vulnModules canvas").get(0).getContext("2d");
    var pieChart = new Chart(pieChartCanvas);
    var getData = function(level) {
      return data.filter(function(item) {
        return item.level === level;
      }).length;
    };
    var dataBlock = function(level) {
      return {
        label: level,
        highlight: colors[level],
        color: colors[level],
        value: getData(level)
      };
    };

    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }
    var levels = data.map(function(item) { return item.level }).filter(onlyUnique);
    var PieData = levels.map(function(level) { return dataBlock(level); });

    var pieOptions = {
      //Boolean - Whether we should show a stroke on each segment
      segmentShowStroke: true,
      //String - The colour of each segment stroke
      segmentStrokeColor: "#fff",
      //Number - The width of each segment stroke
      segmentStrokeWidth: 2,
      //Number - The percentage of the chart that we cut out of the middle
      percentageInnerCutout: 50, // This is 0 for Pie charts
      //Number - Amount of animation steps
      animationSteps: 100,
      //String - Animation easing effect
      animationEasing: "easeOutBounce",
      //Boolean - Whether we animate the rotation of the Doughnut
      animateRotate: true,
      //Boolean - Whether we animate scaling the Doughnut from the centre
      animateScale: false,
      //Boolean - whether to make the chart responsive to window resizing
      responsive: true,
      // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
      maintainAspectRatio: true,
      //String - A legend template
      legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"
    };
    //Create pie or douhnut chart
    // You can switch between pie and douhnut using the method below.
    pieChart.Doughnut(PieData, pieOptions);
  };

  var drawGraph = function(data) {
    data.reverse();
    var labels = data.map(function(row) { return row.number });

    var getData = function(level) {
      var result = data.map(function(scan) {
        return scan.metrics.byLevel[level];
      });
      $('#scanHistory .' + level).text(result[result.length -1]);
      return result;
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
      scaleGridLineColor: 'rgba(0,0,0,.05)',
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
      legendTemplate: '<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>',
      //Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
      maintainAspectRatio: true,
      //Boolean - whether to make the chart responsive to window resizing
      responsive: true
    };
    var lineChartCanvas = $('#scanHistory canvas').get(0).getContext('2d');
    var lineChart = new Chart(lineChartCanvas);
    var lineChartOptions = areaChartOptions;
    lineChartOptions.datasetFill = false;
    lineChart.Line(areaChartData, lineChartOptions);
  };

  var populateSchedule = function(data) {
    var schedule = data.tracking.schedule;
    $(notifyWhen).val(schedule.when).trigger('change');
    $(scanFrequency).val(schedule.freq).trigger('change');
    $(emailNotification).val(schedule.email).trigger('change');
    $(github).val(schedule.github).trigger('change');
  };

  var scansTable = $('#scans table').DataTable(defaultTable({
    columns: [
      { width: '15%', data: 'datetime' },
      { width: '60%', data: 'reason' },
      { width: '5%', data: 'critical' },
      { width: '5%', data: 'high' },
      { width: '5%', data: 'medium' },
      { width: '5%', data: 'low' },
      { width: '5%', data: 'status' }
    ],
    columnDefs: [
      { className: 'td_center', 'targets': [ 2, 3, 4, 5 ] }
    ],
    ajax: {
      url: '/api' + window.location.pathname,
      dataSrc: function(data) {
        ajaxData = data;
        var allScans = data.scans.sort(function(a, b) {
          return a.number < b.number;
        });
        var completeScans = allScans.filter(function(scan) {
          return scan.status !== 'pending';
        });
        var latestScan = (data.metrics === null) ? [] : data.metrics.items;
        if(allScans.length === 0) {
          $('#repoSettings .btn.btn-box-tool').click();
        }

        populateSchedule(data);

        var pieDrawn = false;
        $('#vulnModules button').on('click', function() {
          if(pieDrawn) { return; }
          setTimeout(function() {
            drawPie(latestScan);
            pieDrawn = true;
          }, 500);
        });

        var graphDrawn = false;
        $('#scanHistory button').on('click', function() {
          if(graphDrawn) { return; }
          setTimeout(function() {
            drawGraph(completeScans);
            graphDrawn = true;
          }, 500);
        });

        drawVulnerabilities(latestScan);

        var result = allScans.map(function(scan) {
          if(scan.status === 'pending') {
            scan.metrics = {
              byLevel: { critical: '?', high: '?', medium: '?', low: '?' }
            };
          }
          var result = Object.assign({
            number: scan.number,
            datetime: '<div style="width: 120px">' + scan.datetime + '</div>',
            status: scan.status,
            reason: scan.reason
          }, scan.metrics.byLevel);
          return result;
        });
        return result;
      }
    },
    createdRow: function(row) {
      var element = $('td', row).eq(6);
      var status = element.text();
      var labels = {
        fail: 'label-danger',
        pending: 'label-default',
        pass: 'label-success'
      };
      var label = labels[status] || 'default';
      element.html('<span class="label pull-right ' + label + '">' + status + '</span> ');
    },
    fnDrawCallback: function() {
      $('#scans .overlay').hide();
    }
  }));
  $('#scans tbody').on( 'click', 'tr', function () {
    var data = scansTable.row( this ).data();
    window.location.href = window.location.pathname + '/' + data.number + '?history=true';
  });

  var toggle = function(target, disabled) {
    if(disabled) {
      $(target).attr('disabled', true);
    } else {
      $(target).removeAttr('disabled');
    }
  };

  var toggler = function(val, target) {
    if(val === 'never') {
      toggle(target, true);
    } else {
      toggle(target, false);
    }
  };

  var postSchedule = function() {
    if($(this).attr('disabled') === 'disabled') { return false; }
    toggle(saveSchedule, false);
    $(saveSchedule).text('Saving...');

    var model = {
      freq: $(scanFrequency).val(),
      when: $(notifyWhen).val(),
      email: $(emailNotification).val(),
      last: ajaxData.tracking.schedule.last,
      github: $(github).val()
    };
    var url = '/api' + window.location.pathname + '/tracking/schedule';
    $.ajax({
      type: 'PUT',
      contentType: 'application/json; charset=utf-8',
      url: url,
      data: JSON.stringify(model),
      dataType: 'json',
      complete: function() {
        toggle(saveSchedule, true);
      },
      success: function () {
        $(saveSchedule).text('Saved!');
        setTimeout(function() {
          $('#repoSettings .btn.btn-box-tool').click();
          setTimeout(function() { $(saveSchedule).text('Save'); }, 1000);
        }, 500);
      },
      error: function (){
        $(saveSchedule).text('Save');
        alert('We were unable to save the schedule!');
      }
    });
    return false;
  };

  var toggleSave = function() {
    /* jshint maxcomplexity: 5 */
    var freqValue = $(scanFrequency).val();
    var notifyValue = $(notifyWhen).val();
    var emailValue = $(emailNotification).val();
    var githubValue = $(github).val();

    if(freqValue === 'never' && githubValue === 'never') {
      toggler('never', notifyWhen);
    } else {
      toggler(true, notifyWhen);
    }
    toggler(notifyValue, emailNotification);

    if(notifyValue !== 'never' && emailValue === '') {
      return toggle(saveSchedule, true);
    }
    if(notifyValue !== 'never' && !$(emailNotification).inputmask('isComplete')) {
      return toggle(saveSchedule, true);
    }

    return toggle(saveSchedule, false);
  };

  $(scanFrequency).change(toggleSave);
  $(github).change(toggleSave);
  $(notifyWhen).change(toggleSave);
  $(emailNotification).keyup(toggleSave);
  $(emailNotification).inputmask('email');

  $(saveSchedule).click(postSchedule);
});
