import { Component, OnInit } from '@angular/core';
import { DataService } from './../../services/data/data.service';

@Component({
  selector: 'gp-ui',
  templateUrl: './gp-ui.component.html',
  styleUrls: ['./gp-ui.component.scss']
})
export class GpUiComponent implements OnInit {
  
  showFilters:boolean = false;

  constructor(private data:DataService) {
  }

  ngOnInit() { 
    this.data.showfilter.subscribe(value => this.showFilters = value);
  }


}
