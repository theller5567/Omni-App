import { DataService } from '../../services/data/data.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gp',
  templateUrl: './gp.component.html',
  styleUrls: ['./gp.component.scss']
})
export class GpComponent implements OnInit {
  cart:any[];

  constructor(private data:DataService) { }

  ngOnInit() {
    this.data.cart.subscribe(cart => this.cart = cart);
  }

}
