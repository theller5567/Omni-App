import { Component, EventEmitter, SimpleChanges } from '@angular/core';
import { GprobeUiService } from '../../services/gprobe-ui/gprobe-ui.service';
import { DataService } from './../../services/data/data.service';
import * as _ from 'underscore';

@Component({
  selector: 'extraFilters',
  templateUrl: './extra-filters.component.html',
  styleUrls: ['./extra-filters.component.scss']
})

export class ExtraFiltersComponent {
  selecterArray: string[] = ['window-size', 'type', 'length', 'none'];
  windowList: string[];
  typeList: string[];
  lengthList: any[];
  filteredList: any[];
  windowState: boolean;
  typeState: boolean;
  lengthState: boolean;
  filterState: boolean;
  isChecked: boolean;
  showFilters: boolean;

  constructor(private _service: GprobeUiService, private data: DataService) {
    this.data.showfilter.subscribe(value => {
      this.showFilters = value;
    });
    this.data.fState.subscribe(state => this.filterState = state);
    this.data.selectedProduct.subscribe(product => {
      this.removeFilters();
    });
    this.data.prodList.subscribe(products => {
      if (this.filterState) {
        this.removeFilters();
        this.filteredList = products;
      }
      this.startFiltering(this.filteredList);
    });
  }

  startFiltering(list) {
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
      this.selecterArray = [];
      this.showFilters = false;
    } else {
      this.showFilters = true;
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

  onClick(value) {
    this.hideFilters(value);
  }

  filterClick(type, value) {
    this.filterState = false;
    const list = [];
    this.filteredList.forEach(product => {
      if (product[type] === value) {
        list.push(product);
      }
    });
    this.data.productListChanged(list);
  }

  removeFilters() {
    this.isChecked = !this.isChecked;
    this.windowState = false;
    this.typeState = false;
    this.lengthState = false;
  }

  hideFilters(filter) {
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
      console.log('none');
        this.data.productListChanged(this.filteredList);
        this.windowState = false;
        this.typeState = false;
        this.lengthState = false;
      break;
      default:
        this.windowState = false;
        this.typeState = false;
        this.lengthState = false;
      break;
    }

  }

}
