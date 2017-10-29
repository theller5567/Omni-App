import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { GprobeUiService } from "../../services/gprobe-ui/gprobe-ui.service";
import { DataService } from './../../services/data/data.service';
import * as _ from 'underscore';

@Component({
  selector: 'extraFilters',
  templateUrl: './extra-filters.component.html',
  styleUrls: ['./extra-filters.component.scss']
})
export class ExtraFiltersComponent implements OnInit {
  valueSelected: any;
  selecterArray: string[] = ['window-size','type','length', 'none'];
  windowList: string[];
  typeList: string[];
  lengthList: string[];
  list: any[];
  filteredList: any[];
  showWindow: boolean = false;
  showType: boolean = false;
  showLength: boolean = false;
  isChecked = false;
  showFilters = false;
  showFilter:boolean;
  @Output() newList: EventEmitter<any> = new EventEmitter();

  constructor(private _service: GprobeUiService, private data:DataService) { 
  }

  ngOnInit() {
    this.data.showfilter.subscribe(value => this.showFilter = value);
  }

  toggleFilters(event){
    this.showFilters = !this.showFilters;
  }

  removeFilters(){
    this.isChecked = !this.isChecked;
  }

  showWindowFn(){
    if(this.windowList.length > 1){
      let bl = this.showWindow ? true : false;
      return bl;
    }
  }
  showTypeFn(){
    if(this.typeList.length > 1){
      let bl = this.showType ? true : false;
      return bl;
    }
  }
  showLengthFn(){
    if(this.lengthList.length > 1){
      let bl = this.showLength ? true : false;
      return bl;
    }
  }

  hideFilters(){

  }

  hasChangedagain(value){
    this.removeFilters();
    this.getCurrentGpList();
  }

  change(value){

  }

  getCurrentGpList(){
    this._service.getCurrentGpList()
      .subscribe(repsonse => {
        this.list = repsonse;
        let list = this.list;
        let lengthList = [];
        lengthList = (function (a) {
        list.forEach(product => {
            a.push(product.length);
        });
          return a;
        })([]);
        let typeList = [];
        typeList = (function (a) {
        list.forEach(product => {
            a.push(product.type);
        });
          return a;
        })([]);
        let windowList = [];
        windowList = (function (a) {
        list.forEach(product => {
            a.push(product.window_size);
        });
          return a;
        })([]);

        this.windowList = _.uniq(windowList);
        this.typeList = _.uniq(typeList);
        this.lengthList = _.uniq(lengthList);
        this.isChecked = false;
        this.selecterArray = [];
        if(this.windowList.length > 1){this.selecterArray.push('window-size');}
        if(this.typeList.length > 1){this.selecterArray.push('type');}
        if(this.lengthList.length > 1){this.selecterArray.push('length');}
        this.selecterArray.push('none');
    });
  }

  onClick(event){
    let value = event.target.value;
    let checked = event.target.checked;
    let list = this.list;
    this.newList.emit(list);
    switch(value) {
      case 'window-size':
          this.showWindow = true;
          this.showType = false;
          this.showLength = false;
          break;
      case 'type':
          this.showWindow = false;
          this.showType = true;
          this.showLength = false;
          break;
      case 'length':
          this.showWindow = false;
          this.showType = false;
          this.showLength = true;
          break;
      case 'none':
          this.showWindow = false;
          this.showType = false;
          this.showLength = false;
          this.newList.emit(this.list);
          break;
      default:
    }
  }

  closeFilter(){
    this.showWindow = false;
    this.showType = false;
    this.showLength = false;
    this.newList.emit(this.list);
    this.removeFilters();
  }

  windowClick(value){
    if(value.target.checked){
      let filterValue = value.target.value;
      this.filterByWindow(filterValue);
    }else {
      this.filterByWindow('cancleFilter');
    }
  }

  typeClick(value){
    if(value.target.checked){
      let filterValue = value.target.value;
      this.filterByType(filterValue);
    }else {
      this.filterByType('cancleFilter');
    }
  }

  lengthClick(value){
    let filterValue = value;
    this.filterByLength(filterValue);
  }

  filterByWindow(filteredValue){
    if(filteredValue === 'cancleFilter'){
      this.newList.emit(this.list);
    }else{
      let list = this.list;
      this.filteredList = (function (a) {
        list.forEach(product => {
          if(product.window_size === filteredValue){
            a.push(product);
          }
        });
        return a;
      })([]);
      this.newList.emit(this.filteredList);
    }
  }

  filterByType(filteredValue){
    if(filteredValue === 'cancleFilter'){
      this.newList.emit(this.list);
    }else{
      let list = this.list;
      this.filteredList = (function (a) {
        list.forEach(product => {
          if(product.type === filteredValue){
            a.push(product);
          }
        });
        return a;
      })([]);
      this.newList.emit(this.filteredList);
    }
  }

  filterByLength(filteredValue){
    if(filteredValue === 'cancleFilter'){
      this.newList.emit(this.list);
    }else{
      let list = this.list;
      this.filteredList = (function (a) {
        list.forEach(product => {
          if(product.length === filteredValue){
            a.push(product);
          }
        });
        return a;
      })([]);
      this.newList.emit(this.filteredList);
    }
  }
}
