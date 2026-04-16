/**
 * Shared Types - Product
 */


export enum ProductCategory{
    FOOTBALL = "Football",
    NATATION = "Natation",
    TENNIS = "Tennis",
    BASKET = "Basket",
    RUGBY = "Rugby",
    HANDBALL = "Handball"
}

export interface IProduct {
  name: string;
  description?: string;
  category: ProductCategory;
  stock: number;
  priceCents: number;
  imageUrl?: string;
}
