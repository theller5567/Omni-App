export interface IProduct {
    id: number;
    product_name: string;
    sku: string;
    name: string;
    description: string;
    product_link: string;
    cat_id: string;
    cat_name: string;
    related_products: any[];
    sub_cat_name: string;
    price: number;
    quantity: number;
    images: any[];
}
