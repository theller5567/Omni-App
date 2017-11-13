import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { GprobeUiService } from '../../services/gprobe-ui/gprobe-ui.service';
import { DataService } from './../../services/data/data.service';
import * as _ from 'underscore';

@Component({
  selector: 'extraFilters',
  templateUrl: './extra-filters.component.html',
  styleUrls: ['./extra-filters.component.scss']
})

export class ExtraFiltersComponent implements OnInit {
  valueSelected: any;
  selecterArray: string[] = ['window-size', 'type', 'length', 'none'];
  windowList: string[];
  typeList: string[];
  lengthList: any[];
  filteredList: any[];
  windowState: boolean = false;
  typeState: boolean = false;
  lengthState: boolean = false;
  toggleFilter: boolean = false;
  filterState: boolean;
  isChecked = false;
  showFilters = false;
  filterhide: boolean;
  showFilter: boolean;
  lengthSelected: string;
  oldProducts: any[];
  products: any[];
  @Input() diameterProduct;
  @Output() newList: EventEmitter<any> = new EventEmitter();

  constructor(private _service: GprobeUiService, private data: DataService) {
    this.data.prodList.subscribe(product => {
      if (this.filterState) {
        this.filteredList = product;
        this.startFiltering(this.filteredList);
        if (!this.filterhide) {
          this.closeFilter();
          this.removeFilters();
        }
      }
    });
    this.data.fState.subscribe(state => {
      this.filterState = state;
    });
  }

  ngOnInit() {
    this.data.showfilter.subscribe(value => this.showFilter = value);
  }

  startFiltering(list) {
    console.log('start filtering', list);
    this.selecterArray = [];
    let lengthList = [];
    let windowList = [];
    let typeList = [];
    list.forEach(product => {
      if (product.length) {
        lengthList.push(product.length);
      }
      if (product.window_size) {
        windowList.push(product.window_size);
      }
      if (product.type) {
        typeList.push(product.type);
      }
    });
    lengthList = _.uniq(lengthList);
    windowList = _.uniq(windowList);
    typeList = _.uniq(typeList);
    console.log('lengthList:', lengthList);
    console.log('windowList:', windowList);
    console.log('typeList:', typeList);
    if (this.allowFilter(lengthList, list)) {
      this.selecterArray.push('length');
    }
    if (this.allowFilter(windowList, list)) {
      this.selecterArray.push('window-size');
    }
    if (this.allowFilter(typeList, list)) {
      this.selecterArray.push('type');
    }
    if (!this.allowFilter(lengthList, list) && !this.allowFilter(windowList, list) && !this.allowFilter(typeList, list)) {
      console.log('no filters needed');
      this.selecterArray = [];
      this.showFilters = false;
      this.toggleFilter = false;
    } else {
      this.showFilters = true;
      this.toggleFilter = true;
      this.selecterArray.push('none');
    }
  }

  allowFilter(filterlist, list) {
    if (filterlist.length > 1) {
      if ((list.length - filterlist.length) > 2) {
        return true;
      } else {
        return false;
      }
    }
  }

  toggleFilters() {
    this.toggleFilter = !this.toggleFilter;
  }

  onClick(value) {
    if (this.filterhide) {
      this.hideFilters(value);
    } else {
      this.closeFilter();
    }
    this.hideFilters(value);
  }

  closeFilter() {
    this.hideFilters('none');
  }

  windowClick(value) {
    const list = [];
    this.filteredList.forEach(product => {
      if (product.window_size === value) {
        list.push(product);
      }
    });
    this.data.productListChanged(list);
  }

  typeClick(value) {
    const list = [];
    this.filteredList.forEach(product => {
      if (product.type === value) {
        list.push(product);
      }
    });
    this.data.productListChanged(list);
  }

  lengthClick(value) {
    const list = [];
    this.filteredList.forEach(product => {
      if (product.length === value) {
        list.push(product);
      }
    });
    this.data.productListChanged(list);
  }

  removeFilters() {
    this.isChecked = !this.isChecked;
  }

  hideFilters(filter) {
    this.filterhide = false;
    this.data.filterStateChanged(false);
    const filteredListCat = [];
    const filteredList = [];
    const list = this.filteredList;
    switch (filter) {
      case 'window-size':
        list.forEach(product => {
          if (product.window_size) {
            filteredListCat.push(product.window_size);
            filteredList.push(product);
          }
        });
        this.windowList = _.uniq(filteredListCat);
        this.filteredList = filteredList;
        this.windowState = true;
        this.typeState = false;
        this.lengthState = false;
      break;
      case 'type':
        list.forEach(product => {
          if (product.type) {
            filteredListCat.push(product.type);
            filteredList.push(product);
          }
        });
        this.typeList = _.uniq(filteredListCat);
        this.filteredList = filteredList;
        this.windowState = false;
        this.typeState = true;
        this.lengthState = false;
      break;
      case 'length':
        list.forEach(product => {
          if (product.length) {
            filteredListCat.push(product.length);
            filteredList.push(product);
          }
        });
        this.lengthList = _.uniq(filteredListCat);
        this.filteredList = filteredList;
        this.windowState = false;
        this.typeState = false;
        this.lengthState = true;
      break;
      case 'none':
        this.data.productListChanged(this.filteredList);
        this.windowState = false;
        this.typeState = false;
        this.lengthState = false;
        this.filterhide = true;
      break;
      default:
        this.windowState = false;
        this.typeState = false;
        this.lengthState = false;
      break;
    }

  }


}
