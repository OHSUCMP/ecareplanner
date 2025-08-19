import { Component, OnInit, Input } from '@angular/core';
import { Color, Label } from 'ng2-charts';
import { ChartDataSets, ChartOptions } from 'chart.js';
import * as pluginAnnotations from 'chartjs-plugin-annotation';

@Component({
  selector: 'app-assessment-graph',
  templateUrl: './assessment-graph.component.html',
  styleUrls: ['./assessment-graph.component.css']
})
export class AssessmentGraphComponent implements OnInit {
  @Input() assessmentData: any;

  lineChartData: ChartDataSets[];

  lineChartOptions = {
  };

  lineChartColors: Color[] = [
    {
      borderColor: 'black',
    },
  ];
  lineChartLegend = false;
  lineChartType = 'line';
  lineChartPlugins = [pluginAnnotations];

  ngOnInit(): void {
    this.lineChartData = [
      {
        label: 'Score',
        data: this.assessmentData.responses.map(item => ({
          x: new Date(item.date), // Chart.js time scale will parse this
          y: item.score.value
        })),
        fill: false
      }
    ]

    this.lineChartOptions =
    {
      elements: {
        line: {
          tension: 0
        }
      },
      responsive: false,
      maintainAspectRatio: true,
      scales: {
        xAxes: [{
          type: 'time',
          distribution: 'linear',
          time: {
            unit: 'month',
            format: 'dateFormat',
            displayFormats: {
              millisecond: 'D MMM, h:mm a',
              second: 'D MMM, h:mm a',
              minute: 'D MMM, h:mm a',
              hour: 'D MMM, h:mm a',
              day: 'D MMM',
              week: 'll',
              month: 'MMM YY',
              quarter: 'll',
              year: 'll'
            },
            tooltipFormat: 'MM-DD-YYYY',
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 7
          }
        }]
      }
    };
  }

}
