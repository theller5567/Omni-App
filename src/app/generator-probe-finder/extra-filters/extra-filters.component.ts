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
  lengthList: string[];
  filteredList: any[];
  showWindow: boolean = false;
  showType: boolean = false;
  showLength: boolean = false;
  isChecked = false;
  showFilters = false;
  showFilter: boolean;
  @Input() diameterProduct;
  @Input() products;
  @Output() newList: EventEmitter<any> = new EventEmitter();

  constructor(private _service: GprobeUiService, private data: DataService) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      if (changes['products']) {
        console.log('products changed', changes.products);
        this.products = changes.products.currentValue;
        this.removeFilters();
        this.getCurrentGpList();
      }
    }
  }

  ngOnInit() {
    this.data.showfilter.subscribe(value => this.showFilter = value);
  }

  toggleFilters(event) {
    this.showFilters = !this.showFilters;
  }

  removeFilters() {
    this.isChecked = !this.isChecked;
  }

  showWindowFn() {
    if (this.windowList.length > 1) {
      const bl = this.showWindow ? true : false;
      return bl;
    }
  }
  showTypeFn() {
    if (this.typeList.length > 1) {
      const bl = this.showType ? true : false;
      return bl;
    }
  }
  showLengthFn() {
    if (this.lengthList.length > 1) {
      const bl = this.showLength ? true : false;
      return bl;
    }
  }

  getCurrentGpList() {
    const list = this.products;
    let lengthList: any = [];
    console.log('lengthList', this.products);
    lengthList = (function (a) {
      list.forEach(product => {
        console.log('hre', product);
          a.push(product.length);
      });
    });
    //   return a;
    // })([]);
    // let typeList = [];
    // typeList = (function (a) {
    // list.forEach(product => {
    //     a.push(product.type);
    // });
    //   return a;
    // })([]);
    // let windowList = [];
    // windowList = (function (a) {
    // list.forEach(product => {
    //     a.push(product.window_size);
    // });
    //   return a;
    // })([]);
    // this.isChecked = false;
    // this.selecterArray = [];
    // if (this.windowList.length > 1) {this.selecterArray.push('window-size'); }
    // if (this.typeList.length > 1) {this.selecterArray.push('type'); }
    // if (this.lengthList.length > 1) {this.selecterArray.push('length'); }
    // this.selecterArray.push('none');
  }

  onClick(event) {
    const value = event.target.value;
    const checked = event.target.checked;
    const list = this.products;
    this.newList.emit(list);
    switch (value) {
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
          this.newList.emit(this.products);
          break;
      default:
    }
  }

  closeFilter() {
    this.showWindow = false;
    this.showType = false;
    this.showLength = false;
    this.newList.emit(this.products);
    this.removeFilters();
  }

  windowClick(value) {
    if (value.target.checked) {
      const filterValue = value.target.value;
      console.log('window click', filterValue);
      this.filterByWindow(filterValue);
    }else {
      this.filterByWindow('cancleFilter');
    }
  }

  typeClick(value) {
    if (value.target.checked) {
      const filterValue = value.target.value;
      this.filterByType(filterValue);
    }else {
      this.filterByType('cancleFilter');
    }
  }

  lengthClick(value) {
    const filterValue = value;
    this.filterByLength(filterValue);
  }

  filterByWindow(filteredValue) {
    if (filteredValue === 'cancleFilter') {
      this.newList.emit(this.products);
    }else {
      const list = this.products;
      console.log('window click', list);
      this.filteredList = (function (a) {
        list.forEach(product => {
          if (product.window_size === filteredValue) {
            a.push(product);
          }
        });
        return a;
      })([]);
      this.newList.emit(this.filteredList);
    }
  }

  filterByType(filteredValue) {
    if (filteredValue === 'cancleFilter') {
      this.newList.emit(this.products);
    } else {
      const list = this.products;
      this.filteredList = (function (a) {
        list.forEach(product => {
          if (product.type === filteredValue) {
            a.push(product);
          }
        });
        return a;
      })([]);
      this.newList.emit(this.filteredList);
    }
  }

  filterByLength(filteredValue) {
    if (filteredValue === 'cancleFilter') {
      this.newList.emit(this.products);
    } else {
      const list = this.products;
      this.filteredList = (function (a) {
        list.forEach(product => {
          if (product.length === filteredValue) {
            a.push(product);
          }
        });
        return a;
      })([]);
      this.newList.emit(this.filteredList);
    }
  }
}
